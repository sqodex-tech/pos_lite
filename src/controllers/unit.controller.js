const unitService = require('../services/unit.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache.service');
const logger = require('../utils/logger');

/**
 * Create a new unit
 */
const createUnit = async (req, res, next) => {
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

        const unit = await unitService.createUnit(
            tenantId,
            storeId,
            req.body,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`units_${tenantId}_${storeId}`);

        return res.status(201).json(
            new ApiResponse(201, unit, 'Unit created successfully')
        );
    } catch (error) {
        logger.error(`Create unit error: ${error.message}`);
        next(error);
    }
};

/**
 * Get all units with pagination
 */
const getUnits = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, category, status, includeDeleted } = req.query;

        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const cacheKey = `units_${req.tenantId}_${storeId}_${page}_${limit}_${search || ''}_${category || ''}_${status || ''}_${includeDeleted || ''}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(
                new ApiResponse(200, cachedData.units, 'Units fetched successfully (cached)', cachedData.meta)
            );
        }

        const result = await unitService.getUnits(req.tenantId, storeId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            category,
            status,
            includeDeleted: includeDeleted === 'true'
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        };

        cache.set(cacheKey, { units: result.units, meta }, 300); // 5 min cache

        return res.status(200).json(
            new ApiResponse(200, result.units, 'Units fetched successfully', meta)
        );
    } catch (error) {
        logger.error(`Get units error: ${error.message}`);
        next(error);
    }
};

/**
 * Get units grouped by category
 */
const getUnitsByCategory = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const cacheKey = `units_by_category_${req.tenantId}_${storeId}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(
                new ApiResponse(200, cachedData, 'Units by category fetched successfully (cached)')
            );
        }

        const grouped = await unitService.getUnitsByCategory(req.tenantId, storeId);

        cache.set(cacheKey, grouped, 600); // 10 min cache

        return res.status(200).json(
            new ApiResponse(200, grouped, 'Units by category fetched successfully')
        );
    } catch (error) {
        logger.error(`Get units by category error: ${error.message}`);
        next(error);
    }
};

/**
 * Get unit by ID
 */
const getUnitById = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const unit = await unitService.getUnitById(
            req.tenantId,
            storeId,
            req.params.id
        );

        return res.status(200).json(
            new ApiResponse(200, unit, 'Unit fetched successfully')
        );
    } catch (error) {
        logger.error(`Get unit error: ${error.message}`);
        next(error);
    }
};

/**
 * Update unit
 */
const updateUnit = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const unit = await unitService.updateUnit(
            req.tenantId,
            storeId,
            req.params.id,
            req.body,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`units_${req.tenantId}_${storeId}`);

        return res.status(200).json(
            new ApiResponse(200, unit, 'Unit updated successfully')
        );
    } catch (error) {
        logger.error(`Update unit error: ${error.message}`);
        next(error);
    }
};

/**
 * Delete unit (soft delete)
 */
const deleteUnit = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const result = await unitService.deleteUnit(
            req.tenantId,
            storeId,
            req.params.id,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`units_${req.tenantId}_${storeId}`);

        return res.status(200).json(
            new ApiResponse(200, null, result.message)
        );
    } catch (error) {
        logger.error(`Delete unit error: ${error.message}`);
        next(error);
    }
};

/**
 * Restore deleted unit
 */
const restoreUnit = async (req, res, next) => {
    try {
        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const result = await unitService.restoreUnit(
            req.tenantId,
            storeId,
            req.params.id,
            req.user.id
        );

        // Invalidate cache
        cache.delStartWith(`units_${req.tenantId}_${storeId}`);

        return res.status(200).json(
            new ApiResponse(200, null, result.message)
        );
    } catch (error) {
        logger.error(`Restore unit error: ${error.message}`);
        next(error);
    }
};

/**
 * Convert value between units
 */
const convertUnits = async (req, res, next) => {
    try {
        const { value, fromUnitId, toUnitId } = req.body;

        // Extract storeId from request (validated by middleware)
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId;

        if (!storeId) {
            throw new ApiError(400, 'Store ID is required');
        }

        const result = await unitService.convertUnits(
            req.tenantId,
            storeId,
            value,
            fromUnitId,
            toUnitId
        );

        return res.status(200).json(
            new ApiResponse(200, result, 'Unit conversion successful')
        );
    } catch (error) {
        logger.error(`Convert units error: ${error.message}`);
        next(error);
    }
};

module.exports = {
    createUnit,
    getUnits,
    getUnitsByCategory,
    getUnitById,
    updateUnit,
    deleteUnit,
    restoreUnit,
    convertUnits
};
