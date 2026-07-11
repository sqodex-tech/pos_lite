const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class CategoryService {
    /**
     * Create a new category
     */
    async createCategory(tenantId, storeId, data, userId) {
        return await prisma.$transaction(async (tx) => {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            // Check if category name already exists in this store
            const existingCategory = await tx.category.findFirst({
                where: {
                    tenantId,
                    storeId,
                    name: data.name,
                    deletedAt: null
                }
            });

            if (existingCategory) {
                throw new ApiError(400, `Category '${data.name}' already exists in this store`);
            }

            let level = 0;

            // Validate parent category if provided
            if (data.parentId) {
                const parentCategory = await tx.category.findFirst({
                    where: {
                        id: data.parentId,
                        tenantId,
                        storeId,
                        deletedAt: null
                    }
                });

                if (!parentCategory) {
                    throw new ApiError(404, 'Parent category not found in this store');
                }

                // Check maximum depth
                if (parentCategory.level >= 4) {
                    throw new ApiError(400, 'Maximum category depth (5 levels) reached');
                }

                level = parentCategory.level + 1;
            }

            const category = await tx.category.create({
                data: {
                    ...data,
                    level,
                    tenantId,
                    storeId,
                    createdById: userId
                }
            });

            logger.info(`Category created: ${category.id} in store ${storeId} by user ${userId}`);
            return category;
        });
    }

    /**
     * Get all categories with pagination and filters
     */
    async getCategories(tenantId, storeId, options = {}) {
        // Validate storeId is provided
        if (!storeId) {
            throw new ApiError(400, 'storeId is required');
        }

        const {
            page = 1,
            limit = 20,
            search,
            status,
            parentId,
            includeDeleted = false
        } = options;

        const where = { tenantId, storeId };

        // Filter by deletion status
        if (!includeDeleted) {
            where.deletedAt = null;
        }

        // Filter by status
        if (status && status !== 'all') {
            where.status = status;
        }

        // Filter by parent
        if (parentId !== undefined) {
            where.parentId = parentId === 'null' ? null : parentId;
        }

        // Search by name or description
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } }
            ];
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                include: {
                    parent: { select: { name: true, level: true } }
                },
                orderBy: [
                    { sortOrder: 'asc' },
                    { name: 'asc' }
                ],
                skip,
                take: limitNum
            }),
            prisma.category.count({ where })
        ]);

        return {
            categories,
            total,
            page: pageNum,
            limit: limitNum
        };
    }

    /**
     * Get category tree (hierarchical structure)
     */
    async getCategoryTree(tenantId, storeId) {
        // Validate storeId is provided
        if (!storeId) {
            throw new ApiError(400, 'storeId is required');
        }

        const categories = await prisma.category.findMany({
            where: {
                tenantId,
                storeId,
                deletedAt: null,
                status: 'active'
            },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ]
        });

        // Build tree structure
        const categoryMap = {};
        const tree = [];

        // First pass: create map
        categories.forEach(cat => {
            categoryMap[cat.id] = { ...cat, children: [] };
        });

        // Second pass: build tree
        categories.forEach(cat => {
            if (cat.parentId) {
                const parent = categoryMap[cat.parentId];
                if (parent) {
                    parent.children.push(categoryMap[cat.id]);
                }
            } else {
                tree.push(categoryMap[cat.id]);
            }
        });

        return tree;
    }

    /**
     * Get category by ID
     */
    async getCategoryById(tenantId, storeId, categoryId) {
        // Validate storeId is provided
        if (!storeId) {
            throw new ApiError(400, 'storeId is required');
        }

        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                tenantId,
                storeId,
                deletedAt: null
            },
            include: {
                parent: { select: { name: true, level: true } },
                children: true
            }
        });

        if (!category) {
            throw new ApiError(404, 'Category not found in this store');
        }

        return category;
    }

    /**
     * Update category
     */
    async updateCategory(tenantId, storeId, categoryId, data, userId) {
        return await prisma.$transaction(async (tx) => {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            const category = await tx.category.findFirst({
                where: {
                    id: categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null
                }
            });

            if (!category) {
                throw new ApiError(404, 'Category not found in this store');
            }

            // Prevent storeId changes
            if (data.storeId && data.storeId !== storeId) {
                throw new ApiError(400, 'Cannot change category store assignment');
            }

            // Check if name is being changed and already exists in this store
            if (data.name && data.name !== category.name) {
                const existingCategory = await tx.category.findFirst({
                    where: {
                        tenantId,
                        storeId,
                        name: data.name,
                        id: { not: categoryId },
                        deletedAt: null
                    }
                });

                if (existingCategory) {
                    throw new ApiError(400, `Category '${data.name}' already exists in this store`);
                }
            }

            let level = category.level;

            // Validate parent change
            if (data.parentId !== undefined && data.parentId !== category.parentId) {
                if (data.parentId) {
                    // Check if trying to set self as parent
                    if (data.parentId === categoryId) {
                        throw new ApiError(400, 'Category cannot be its own parent');
                    }

                    // Check if trying to set a child as parent (circular reference)
                    const descendants = await this.getDescendants(categoryId, storeId);
                    if (descendants.some(d => d.id === data.parentId)) {
                        throw new ApiError(400, 'Cannot set a descendant as parent');
                    }

                    const parentCategory = await tx.category.findFirst({
                        where: {
                            id: data.parentId,
                            tenantId,
                            storeId,
                            deletedAt: null
                        }
                    });

                    if (!parentCategory) {
                        throw new ApiError(404, 'Parent category not found in this store');
                    }

                    if (parentCategory.level >= 4) {
                        throw new ApiError(400, 'Maximum category depth (5 levels) reached');
                    }
                    
                    level = parentCategory.level + 1;
                } else {
                    level = 0;
                }
            }

            // Sync check: If deactivating or deleting, check for dependent items
            const syncService = require('./sync.service');
            await syncService.syncItemsOnCategoryUpdate(tenantId, storeId, categoryId, data);

            const updatedCategory = await tx.category.update({
                where: { id: categoryId },
                data: {
                    ...data,
                    level,
                    updatedById: userId
                }
            });

            logger.info(`Category updated: ${categoryId} in store ${storeId} by user ${userId}`);
            return updatedCategory;
        });
    }

    /**
     * Delete category (soft delete)
     */
    async deleteCategory(tenantId, storeId, categoryId, userId) {
        return await prisma.$transaction(async (tx) => {
            // Validate storeId is provided
            if (!storeId) {
                throw new ApiError(400, 'storeId is required');
            }

            const category = await tx.category.findFirst({
                where: {
                    id: categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null
                }
            });

            if (!category) {
                throw new ApiError(404, 'Category not found in this store');
            }

            // Check if category has children
            const childrenCount = await tx.category.count({
                where: {
                    parentId: categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null
                }
            });

            if (childrenCount > 0) {
                throw new ApiError(400, 'Cannot delete category with subcategories. Delete subcategories first.');
            }

            // Check if category is used in items
            const itemsCount = await tx.item.count({
                where: {
                    categoryId: categoryId,
                    tenantId,
                    storeId,
                    deletedAt: null
                }
            });

            if (itemsCount > 0) {
                throw new ApiError(400, `Cannot delete category. It is used by ${itemsCount} item(s).`);
            }

            await tx.category.update({
                where: { id: categoryId },
                data: {
                    deletedAt: new Date(),
                    updatedById: userId
                }
            });

            logger.info(`Category deleted: ${categoryId} in store ${storeId} by user ${userId}`);
            return { message: 'Category deleted successfully' };
        });
    }

    /**
     * Restore deleted category
     */
    async restoreCategory(tenantId, storeId, categoryId, userId) {
        // Validate storeId is provided
        if (!storeId) {
            throw new ApiError(400, 'storeId is required');
        }

        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                tenantId,
                storeId,
                deletedAt: { not: null }
            }
        });

        if (!category) {
            throw new ApiError(404, 'Deleted category not found in this store');
        }

        await prisma.category.update({
            where: { id: categoryId },
            data: {
                deletedAt: null,
                updatedById: userId
            }
        });

        logger.info(`Category restored: ${categoryId} in store ${storeId} by user ${userId}`);
        return { message: 'Category restored successfully' };
    }

    /**
     * Get all descendants of a category
     */
    async getDescendants(categoryId, storeId) {
        const descendants = [];
        const queue = [categoryId];

        while (queue.length > 0) {
            const currentId = queue.shift();
            const children = await prisma.category.findMany({
                where: {
                    parentId: currentId,
                    storeId,
                    deletedAt: null
                }
            });

            descendants.push(...children);
            queue.push(...children.map(c => c.id));
        }

        return descendants;
    }
}

module.exports = new CategoryService();
