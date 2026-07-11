const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const syncService = require('./sync.service');

class InventoryService {
    /**
     * Create item with store isolation and sync
     */
    async createItem(tenantId, storeId, itemData, userId) {
        return await prisma.$transaction(async (tx) => {
            try {
                // Validate references and store isolation
                await syncService.validateItemReferences(tenantId, storeId, itemData, tx);

                // Check if item with same name or barcode exists in this store
                const existingQuery = {
                    tenantId,
                    storeId,
                    deletedAt: null,
                    OR: [
                        { name: itemData.name }
                    ]
                };

                if (itemData.barcode) {
                    existingQuery.OR.push({ barcode: itemData.barcode });
                }

                const existingItem = await tx.item.findFirst({ where: existingQuery });

                const { initialStock, ...dataToSave } = itemData;

                if (existingItem) {
                    // Update existing item details
                    await tx.item.update({
                        where: { id: existingItem.id },
                        data: {
                            ...dataToSave,
                            updatedById: userId
                        }
                    });

                    // Add incremental stock if provided
                    if (initialStock && initialStock > 0) {
                        const stockService = require('./stock.service');
                        await stockService._updateStockInternal(
                            tenantId,
                            storeId,
                            existingItem.id,
                            initialStock,
                            'IN',
                            userId,
                            null,
                            'Restock',
                            'Added during duplicate product creation attempt',
                            tx
                        );
                    }

                    logger.info(`Item updated (duplicate handling): ${existingItem.id} in store ${storeId} by user ${userId}`);

                    return await tx.item.findUnique({
                        where: { id: existingItem.id },
                        include: {
                            category: { select: { name: true, description: true, icon: true, color: true } },
                            brand: { select: { name: true } },
                            unit: { select: { name: true, symbol: true, category: true } },
                            store: { select: { name: true, code: true } },
                            stocks: {
                                where: { storeId },
                                select: { quantity: true, lastRestocked: true }
                            }
                        }
                    }).then(i => {
                        if (!i) return i;
                        const { stocks, ...rest } = i;
                        return { ...rest, stock: stocks?.[0] || { quantity: 0 } };
                    });
                }

                // Create item
                const item = await tx.item.create({
                    data: {
                        ...dataToSave,
                        tenantId,
                        storeId,
                        createdById: userId
                    }
                });

                // Sync: Create initial stock record
                await syncService.syncStockOnItemCreate(tenantId, storeId, item.id, userId, tx);

                if (initialStock && initialStock > 0) {
                    const stockService = require('./stock.service');
                    await stockService._updateStockInternal(
                        tenantId,
                        storeId,
                        item.id,
                        initialStock,
                        'IN',
                        userId,
                        null,
                        'Initial Stock',
                        'Added during product creation',
                        tx
                    );
                }

                logger.info(`Item created: ${item.id} in store ${storeId} by user ${userId}`);

                // Return populated item
                return await tx.item.findUnique({
                    where: { id: item.id },
                    include: {
                        category: { select: { name: true, description: true, icon: true, color: true } },
                        brand: { select: { name: true } },
                        unit: { select: { name: true, symbol: true, category: true } },
                        store: { select: { name: true, code: true } },
                        stocks: {
                            where: { storeId },
                            select: { quantity: true, lastRestocked: true }
                        }
                    }
                }).then(i => {
                    if (!i) return i;
                    const { stocks, ...rest } = i;
                    return { ...rest, stock: stocks?.[0] || { quantity: 0 } };
                });
            } catch (error) {
                logger.error(`Error creating item: ${error.message}`);
                throw error;
            }
        }, { maxWait: 10000, timeout: 20000 });
    }

    /**
     * Get items by store with isolation
     */
    async getItems(tenantId, storeId, userId, options = {}) {
        try {
            // Validate store access
            await syncService.validateStoreIsolation(tenantId, storeId, userId);

            // Use sync service to get items with full references
            return await syncService.getItemsByStore(tenantId, storeId, options);
        } catch (error) {
            logger.error(`Error fetching items: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get item by ID with store isolation
     */
    async getItemById(tenantId, storeId, itemId, userId) {
        try {
            // Validate store access
            await syncService.validateStoreIsolation(tenantId, storeId, userId);

            const item = await prisma.item.findFirst({
                where: {
                    id: itemId,
                    tenantId,
                    storeId,
                    deletedAt: null
                },
                include: {
                    category: { select: { name: true, description: true, icon: true, color: true } },
                    brand: { select: { name: true } },
                    unit: { select: { name: true, symbol: true, category: true } },
                    store: { select: { name: true, code: true } },
                    createdBy: { select: { name: true, email: true } },
                    updatedBy: { select: { name: true, email: true } }
                }
            });

            if (!item) {
                throw new ApiError(404, 'Item not found in this store');
            }

            // Get stock
            const stock = await prisma.stock.findFirst({
                where: {
                    storeId,
                    itemId: item.id
                }
            });

            return {
                ...item,
                stock: stock || { quantity: 0 }
            };
        } catch (error) {
            logger.error(`Error fetching item: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update item with sync validation
     */
    async updateItem(tenantId, storeId, itemId, updateData, userId) {
        return await prisma.$transaction(async (tx) => {
            try {
                // Validate store access
                await syncService.validateStoreIsolation(tenantId, storeId, userId);

                const item = await tx.item.findFirst({
                    where: {
                        id: itemId,
                        tenantId,
                        storeId,
                        deletedAt: null
                    }
                });

                if (!item) {
                    throw new ApiError(404, 'Item not found in this store');
                }

                // If category or unit is being changed, validate references
                if (updateData.categoryId || updateData.unitId) {
                    const dataToValidate = {
                        categoryId: updateData.categoryId || item.categoryId,
                        unitId: updateData.unitId || item.unitId
                    };
                    await syncService.validateItemReferences(tenantId, storeId, dataToValidate, tx);
                }

                // Check for duplicate name/barcode
                if (updateData.name || updateData.barcode) {
                    const duplicateQuery = {
                        tenantId,
                        storeId,
                        id: { not: itemId },
                        deletedAt: null,
                        OR: []
                    };

                    if (updateData.name && updateData.name !== item.name) {
                        duplicateQuery.OR.push({ name: updateData.name });
                    }

                    if (updateData.barcode && updateData.barcode !== item.barcode) {
                        duplicateQuery.OR.push({ barcode: updateData.barcode });
                    }

                    if (duplicateQuery.OR.length > 0) {
                        const duplicate = await tx.item.findFirst({ where: duplicateQuery });
                        if (duplicate) {
                            const field = duplicate.name === updateData.name ? 'name' : 'barcode';
                            throw new ApiError(400, `Item with this ${field} already exists in this store`);
                        }
                    }
                }

                const { addStock, ...dataToUpdate } = updateData;

                await tx.item.update({
                    where: { id: itemId },
                    data: {
                        ...dataToUpdate,
                        updatedById: userId
                    }
                });

                if (addStock && addStock > 0) {
                    const stockService = require('./stock.service');
                    await stockService._updateStockInternal(
                        tenantId,
                        storeId,
                        itemId,
                        addStock,
                        'IN',
                        userId,
                        null,
                        'Restock',
                        'Added from product edit form',
                        tx
                    );
                }

                logger.info(`Item updated: ${itemId} in store ${storeId} by user ${userId}`);

                return await tx.item.findUnique({
                    where: { id: itemId },
                    include: {
                        category: { select: { name: true, description: true, icon: true, color: true } },
                        brand: { select: { name: true } },
                        unit: { select: { name: true, symbol: true, category: true } },
                        store: { select: { name: true, code: true } },
                        stocks: {
                            where: { storeId },
                            select: { quantity: true, lastRestocked: true }
                        }
                    }
                }).then(i => {
                    if (!i) return i;
                    const { stocks, ...rest } = i;
                    return { ...rest, stock: stocks?.[0] || { quantity: 0 } };
                });
            } catch (error) {
                logger.error(`Error updating item ${itemId}: ${error.message}`);
                throw error;
            }
        }, { maxWait: 10000, timeout: 20000 });
    }

    /**
     * Delete item with sync validation
     */
    async deleteItem(tenantId, storeId, itemId, userId) {
        return await prisma.$transaction(async (tx) => {
            try {
                // Validate store access
                await syncService.validateStoreIsolation(tenantId, storeId, userId);

                const item = await tx.item.findFirst({
                    where: {
                        id: itemId,
                        tenantId,
                        storeId,
                        deletedAt: null
                    }
                });

                if (!item) {
                    throw new ApiError(404, 'Item not found in this store');
                }

                // Validate deletion
                await syncService.validateItemDeletion(tenantId, storeId, itemId, tx);

                // Soft delete
                await tx.item.update({
                    where: { id: itemId },
                    data: {
                        deletedAt: new Date(),
                        status: 'inactive',
                        updatedById: userId
                    }
                });

                logger.info(`Item deleted: ${itemId} in store ${storeId} by user ${userId}`);
                return true;
            } catch (error) {
                logger.error(`Error deleting item ${itemId}: ${error.message}`);
                throw error;
            }
        }, { maxWait: 10000, timeout: 20000 });
    }

    /**
     * Get store stock with isolation
     */
    async getStoreStock(tenantId, storeId, userId, options = {}) {
        try {
            // Validate store access
            await syncService.validateStoreIsolation(tenantId, storeId, userId);

            const {
                page = 1,
                limit = 20,
                lowStockOnly = false,
                search
            } = options;

            const limitNum = parseInt(limit);
            const pageNum = parseInt(page);
            const skip = (pageNum - 1) * limitNum;

            if (lowStockOnly === 'true' || lowStockOnly === true) {
                // Get items with low stock
                const stocks = await prisma.stock.findMany({
                    where: {
                        storeId,
                        item: {
                            deletedAt: null
                        }
                    },
                    include: {
                        item: {
                            include: {
                                category: { select: { name: true } },
                                brand: { select: { name: true } },
                                unit: { select: { name: true, symbol: true } }
                            }
                        }
                    }
                });

                // Filter low stock
                const lowStockItems = stocks.filter(stock => {
                    return stock.item && stock.quantity <= stock.item.lowStockAlert;
                });

                return {
                    stock: lowStockItems.map(stock => ({ ...stock, itemId: stock.item })), // Emulate populate shape
                    total: lowStockItems.length,
                    page: 1,
                    limit: lowStockItems.length
                };
            }

            // Regular stock query
            const where = {
                tenantId,
                storeId,
                deletedAt: null
            };

            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { barcode: { contains: search } }
                ];
            }

            const items = await prisma.item.findMany({
                where,
                include: {
                    category: { select: { name: true } },
                    brand: { select: { name: true } },
                    unit: { select: { name: true, symbol: true } }
                },
                orderBy: { name: 'asc' },
                skip,
                take: limitNum
            });

            const total = await prisma.item.count({ where });

            const itemIds = items.map(i => i.id);
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

            const stockWithItems = items.map(item => ({
                ...(stockMap[item.id] || {}),
                itemId: item, // Emulate populate shape
                isLowStock: (stockMap[item.id]?.quantity || 0) <= item.lowStockAlert
            }));

            return {
                stock: stockWithItems,
                total,
                page: pageNum,
                limit: limitNum
            };
        } catch (error) {
            logger.error(`Error fetching store stock: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify data integrity for a store
     */
    async verifyIntegrity(tenantId, storeId, userId) {
        try {
            // Validate store access
            await syncService.validateStoreIsolation(tenantId, storeId, userId);

            return await syncService.verifyDataIntegrity(tenantId, storeId);
        } catch (error) {
            logger.error(`Error verifying integrity: ${error.message}`);
            throw error;
        }
    }

    /**
     * Repair data integrity issues
     */
    async repairIntegrity(tenantId, storeId, issues, userId) {
        try {
            // Validate store access (ADMIN only)
            const access = await syncService.validateStoreIsolation(tenantId, storeId, userId);

            if (access.role !== 'ADMIN') {
                throw new ApiError(403, 'Only ADMIN can repair data integrity');
            }

            return await syncService.repairDataIntegrity(tenantId, storeId, issues);
        } catch (error) {
            logger.error(`Error repairing integrity: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new InventoryService();
