const categoryService = require('../services/category.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache.service');
const logger = require('../utils/logger');

/**
 * Create a new category
 */
const createCategory = async (req, res, next) => {
    try {
        // Use tenantId from request or body
        const tenantId = req.tenantId || req.body.tenantId || req.user.tenantId;

        if (!tenantId) {
            throw new ApiError(400, 'Tenant ID is required');
        }

        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const category = await categoryService.createCategory(
            tenantId,
            storeId,
            req.body,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`categories_${tenantId}_${storeId}`);

        return res.status(201).json(
            new ApiResponse(201, category, 'Category created successfully')
        );
    } catch (error) {
        logger.error(`Create category error: ${error.message}`);
        next(error);
    }
};

/**
 * Get all categories with pagination
 */
const getCategories = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, status, parentId, includeDeleted } = req.query;

        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const cacheKey = `categories_${req.tenantId}_${storeId}_${page}_${limit}_${search || ''}_${status || ''}_${parentId || ''}_${includeDeleted || ''}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(
                new ApiResponse(200, cachedData.categories, 'Categories fetched successfully (cached)', cachedData.meta)
            );
        }

        const result = await categoryService.getCategories(req.tenantId, storeId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            status,
            parentId,
            includeDeleted: includeDeleted === 'true'
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        };

        cache.set(cacheKey, { categories: result.categories, meta }, 300); // 5 min cache

        return res.status(200).json(
            new ApiResponse(200, result.categories, 'Categories fetched successfully', meta)
        );
    } catch (error) {
        logger.error(`Get categories error: ${error.message}`);
        next(error);
    }
};

/**
 * Get category tree (hierarchical structure)
 */
const getCategoryTree = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const cacheKey = `category_tree_${req.tenantId}_${storeId}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(
                new ApiResponse(200, cachedData, 'Category tree fetched successfully (cached)')
            );
        }

        const tree = await categoryService.getCategoryTree(req.tenantId, storeId);

        cache.set(cacheKey, tree, 600); // 10 min cache

        return res.status(200).json(
            new ApiResponse(200, tree, 'Category tree fetched successfully')
        );
    } catch (error) {
        logger.error(`Get category tree error: ${error.message}`);
        next(error);
    }
};

/**
 * Get category by ID
 */
const getCategoryById = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const category = await categoryService.getCategoryById(
            req.tenantId,
            storeId,
            req.params.id
        );

        return res.status(200).json(
            new ApiResponse(200, category, 'Category fetched successfully')
        );
    } catch (error) {
        logger.error(`Get category error: ${error.message}`);
        next(error);
    }
};

/**
 * Update category
 */
const updateCategory = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const category = await categoryService.updateCategory(
            req.tenantId,
            storeId,
            req.params.id,
            req.body,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`categories_${req.tenantId}_${storeId}`);
        cache.delStartWith(`category_tree_${req.tenantId}_${storeId}`);

        return res.status(200).json(
            new ApiResponse(200, category, 'Category updated successfully')
        );
    } catch (error) {
        logger.error(`Update category error: ${error.message}`);
        next(error);
    }
};

/**
 * Delete category (soft delete)
 */
const deleteCategory = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const result = await categoryService.deleteCategory(
            req.tenantId,
            storeId,
            req.params.id,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`categories_${req.tenantId}_${storeId}`);
        cache.delStartWith(`category_tree_${req.tenantId}_${storeId}`);

        return res.status(200).json(
            new ApiResponse(200, null, result.message)
        );
    } catch (error) {
        logger.error(`Delete category error: ${error.message}`);
        next(error);
    }
};

/**
 * Restore deleted category
 */
const restoreCategory = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const result = await categoryService.restoreCategory(
            req.tenantId,
            storeId,
            req.params.id,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`categories_${req.tenantId}_${storeId}`);
        cache.delStartWith(`category_tree_${req.tenantId}_${storeId}`);

        return res.status(200).json(
            new ApiResponse(200, null, result.message)
        );
    } catch (error) {
        logger.error(`Restore category error: ${error.message}`);
        next(error);
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryTree,
    getCategoryById,
    updateCategory,
    deleteCategory,
    restoreCategory
};
