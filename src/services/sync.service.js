const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class SyncService {
    /**
     * Validate and sync item references (category, unit, store)
     */
    async validateItemReferences(tenantId, storeId, itemData, tx = null) {
        const client = tx || prisma;

        try {
            // 1. Validate store exists and belongs to tenant
            const store = await client.store.findFirst({
                where: {
                    id: storeId,
                    tenantId,
                    deletedAt: null,
                    status: 'active'
                }
            });

            if (!store) {
                throw new ApiError(404, 'Store not found or inactive');
            }

            // 2. Validate category exists, belongs to tenant, and belongs to same store
            const category = await client.category.findFirst({
                where: {
                    id: itemData.categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null,
                    status: 'active'
                }
            });

            if (!category) {
                throw new ApiError(404, 'Category not found, deleted, inactive, or does not belong to this store');
            }

            // 3. Validate unit exists, belongs to tenant, and belongs to same store
            const unit = await client.unit.findFirst({
                where: {
                    id: itemData.unitId,
                    tenantId,
                    storeId,
                    deletedAt: null,
                    status: 'active'
                }
            });

            if (!unit) {
                throw new ApiError(404, 'Unit not found, deleted, inactive, or does not belong to this store');
            }

            logger.info(`Item references validated for store ${storeId}`);

            return {
                store,
                category,
                unit,
                isValid: true
            };
        } catch (error) {
            logger.error(`Reference validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sync item when category is updated
     */
    async syncItemsOnCategoryUpdate(tenantId, storeId, categoryId, updates, tx = null) {
        const client = tx || prisma;
        try {
            // Validate category belongs to the specified store
            const category = await client.category.findFirst({
                where: {
                    id: categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null
                }
            });

            if (!category) {
                throw new ApiError(404, 'Category not found or does not belong to this store');
            }

            // If category is being deactivated or deleted, check for dependent items in this store
            if (updates.status === 'inactive' || updates.deletedAt) {
                const itemCount = await client.item.count({
                    where: {
                        tenantId,
                        storeId,
                        categoryId,
                        deletedAt: null
                    }
                });

                if (itemCount > 0) {
                    throw new ApiError(
                        400,
                        `Cannot deactivate/delete category. It is used by ${itemCount} item(s) in this store.`
                    );
                }
            }

            logger.info(`Category ${categoryId} sync completed for store ${storeId}`);
            return { synced: true };
        } catch (error) {
            logger.error(`Category sync failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sync item when unit is updated
     */
    async syncItemsOnUnitUpdate(tenantId, storeId, unitId, updates, tx = null) {
        const client = tx || prisma;
        try {
            // Validate unit belongs to the specified store
            const unit = await client.unit.findFirst({
                where: {
                    id: unitId,
                    tenantId,
                    storeId,
                    deletedAt: null
                }
            });

            if (!unit) {
                throw new ApiError(404, 'Unit not found or does not belong to this store');
            }

            // If unit is being deactivated or deleted, check for dependent items in this store
            if (updates.status === 'inactive' || updates.deletedAt) {
                const itemCount = await client.item.count({
                    where: {
                        tenantId,
                        storeId,
                        unitId,
                        deletedAt: null
                    }
                });

                if (itemCount > 0) {
                    throw new ApiError(
                        400,
                        `Cannot deactivate/delete unit. It is used by ${itemCount} item(s) in this store.`
                    );
                }
            }

            logger.info(`Unit ${unitId} sync completed for store ${storeId}`);
            return { synced: true };
        } catch (error) {
            logger.error(`Unit sync failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Ensure store-level data isolation
     */
    async validateStoreIsolation(tenantId, storeId, userId) {
        try {
            // Get user details
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            // Verify user belongs to the same tenant
            if (user.tenantId !== tenantId) {
                throw new ApiError(403, 'Access denied: User does not belong to this tenant');
            }

            // ADMIN can access all stores in their tenant
            if (user.role === 'ADMIN') {
                const store = await prisma.store.findFirst({
                    where: {
                        id: storeId,
                        tenantId,
                        deletedAt: null
                    }
                });

                if (!store) {
                    throw new ApiError(404, 'Store not found');
                }

                return { hasAccess: true, role: 'ADMIN' };
            }

            // For other roles, check if user is assigned to the store
            const assignedStores = user.assignedStores || [];
            if (!assignedStores.includes(storeId)) {
                throw new ApiError(403, 'Access denied: User is not assigned to this store');
            }

            return { hasAccess: true, role: user.role };
        } catch (error) {
            logger.error(`Store isolation validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sync stock when item is created
     */
    async syncStockOnItemCreate(tenantId, storeId, itemId, userId, tx = null) {
        const client = tx || prisma;
        try {
            // Create initial stock record for the item in this store
            const existingStock = await client.stock.findFirst({
                where: { storeId, itemId }
            });

            if (!existingStock) {
                await client.stock.create({
                    data: {
                        tenantId,
                        storeId,
                        itemId,
                        quantity: 0
                    }
                });

                logger.info(`Stock record created for item ${itemId} in store ${storeId}`);
            }

            return { synced: true };
        } catch (error) {
            logger.error(`Stock sync on item create failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate item deletion
     */
    async validateItemDeletion(tenantId, storeId, itemId, tx = null) {
        const client = tx || prisma;
        try {
            // Check if item has stock
            const stock = await client.stock.findFirst({
                where: {
                    storeId,
                    itemId,
                    quantity: { gt: 0 }
                }
            });

            if (stock) {
                throw new ApiError(
                    400,
                    `Cannot delete item. Current stock: ${stock.quantity}. Clear stock first.`
                );
            }

            // Check if item is used in active transactions
            const transactionCount = await client.transactionItem.count({
                where: {
                    itemId,
                    transaction: {
                        storeId,
                        deletedAt: null
                    }
                }
            });

            if (transactionCount > 0) {
                throw new ApiError(
                    400,
                    `Cannot delete item. It is used in ${transactionCount} transaction(s). Use soft delete instead.`
                );
            }

            return { canDelete: true };
        } catch (error) {
            logger.error(`Item deletion validation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get items by store with full references
     */
    async getItemsByStore(tenantId, storeId, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search,
                categoryId,
                status,
                includeDeleted = false
            } = options;

            const where = { tenantId, storeId };

            if (!includeDeleted) {
                where.deletedAt = null;
            }

            if (status && status !== 'all') {
                where.status = status;
            }

            if (categoryId) {
                where.categoryId = categoryId;
            }

            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { barcode: { contains: search } }
                ];
            }

            const limitNum = Math.min(parseInt(limit) || 20, 100);
            const pageNum = parseInt(page);
            const skip = (pageNum - 1) * limitNum;

            const items = await prisma.item.findMany({
                where,
                include: {
                    category: { select: { name: true, description: true, icon: true, color: true } },
                    unit: { select: { name: true, symbol: true, category: true } },
                    store: { select: { name: true, code: true } },
                    createdBy: { select: { name: true, email: true } },
                    updatedBy: { select: { name: true, email: true } }
                },
                orderBy: { name: 'asc' },
                skip,
                take: limitNum
            });

            const total = await prisma.item.count({ where });

            // Get stock for each item
            const itemIds = items.map(item => item.id);
            const stocks = await prisma.stock.findMany({
                where: {
                    storeId,
                    itemId: { in: itemIds }
                }
            });

            const stockMap = {};
            stocks.forEach(stock => {
                stockMap[stock.itemId] = stock;
            });

            // Attach stock to items
            const itemsWithStock = items.map(item => ({
                ...item,
                stock: stockMap[item.id] || { quantity: 0 }
            }));

            return {
                items: itemsWithStock,
                total,
                page: pageNum,
                limit: limitNum
            };
        } catch (error) {
            logger.error(`Get items by store failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify data integrity across all entities with store-level isolation
     */
    async verifyDataIntegrity(tenantId, storeId) {
        const issues = [];

        try {
            // Simplified data integrity checks for Prisma
            const items = await prisma.item.findMany({
                where: { tenantId, storeId, deletedAt: null },
                include: { category: true, unit: true }
            });

            const invalidCategories = items.filter(i => !i.category || i.category.deletedAt || i.category.status === 'inactive' || i.category.storeId !== storeId);
            if (invalidCategories.length > 0) {
                issues.push({
                    type: 'INVALID_CATEGORY_REFERENCE',
                    count: invalidCategories.length,
                    items: invalidCategories.map(i => ({
                        itemId: i.id,
                        categoryId: i.categoryId,
                        reason: 'Category invalid or belongs to different store'
                    }))
                });
            }

            const invalidUnits = items.filter(i => !i.unit || i.unit.deletedAt || i.unit.status === 'inactive' || i.unit.storeId !== storeId);
            if (invalidUnits.length > 0) {
                issues.push({
                    type: 'INVALID_UNIT_REFERENCE',
                    count: invalidUnits.length,
                    items: invalidUnits.map(i => ({
                        itemId: i.id,
                        unitId: i.unitId,
                        reason: 'Unit invalid or belongs to different store'
                    }))
                });
            }

            // Check for items without stock records
            const stocks = await prisma.stock.findMany({
                where: { storeId, itemId: { in: items.map(i => i.id) } }
            });
            const stockItemIds = new Set(stocks.map(s => s.itemId));
            const itemsWithoutStock = items.filter(i => !stockItemIds.has(i.id));

            if (itemsWithoutStock.length > 0) {
                issues.push({
                    type: 'MISSING_STOCK_RECORD',
                    count: itemsWithoutStock.length,
                    items: itemsWithoutStock.map(i => i.id)
                });
            }

            logger.info(`Data integrity check completed for store ${storeId}: ${issues.length} issue type(s) found`);

            return {
                isValid: issues.length === 0,
                issues,
                checkedAt: new Date()
            };
        } catch (error) {
            logger.error(`Data integrity verification failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Repair data integrity issues with store-level awareness
     */
    async repairDataIntegrity(tenantId, storeId, issues) {
        return await prisma.$transaction(async (tx) => {
            const repaired = [];
            const failed = [];

            try {
                for (const issue of issues) {
                    try {
                        switch (issue.type) {
                            case 'MISSING_STOCK_RECORD':
                                // Create missing stock records
                                for (const itemId of issue.items) {
                                    const existingStock = await tx.stock.findFirst({
                                        where: { storeId, itemId }
                                    });

                                    if (!existingStock) {
                                        await tx.stock.create({
                                            data: { tenantId, storeId, itemId, quantity: 0 }
                                        });

                                        repaired.push({
                                            type: issue.type,
                                            itemId,
                                            action: 'STOCK_CREATED'
                                        });
                                    }
                                }
                                break;

                            case 'INVALID_CATEGORY_REFERENCE':
                            case 'INVALID_UNIT_REFERENCE':
                            case 'INVALID_CATEGORY_PARENT':
                            case 'INVALID_UNIT_BASE':
                                // These require manual intervention
                                failed.push({
                                    type: issue.type,
                                    reason: 'Requires manual reassignment - cross-store references detected',
                                    items: issue.items
                                });
                                break;
                        }
                    } catch (error) {
                        failed.push({
                            type: issue.type,
                            error: error.message,
                            items: issue.items
                        });
                    }
                }

                logger.info(`Data integrity repair completed for store ${storeId}: ${repaired.length} repaired, ${failed.length} failed`);

                return {
                    repaired,
                    failed,
                    repairedAt: new Date()
                };
            } catch (error) {
                logger.error(`Data integrity repair failed: ${error.message}`);
                throw error;
            }
        });
    }
}

module.exports = new SyncService();
