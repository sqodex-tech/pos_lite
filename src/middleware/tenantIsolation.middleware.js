const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');

/**
 * Middleware to ensure tenant isolation
 * Automatically filters queries by tenantId
 */
const tenantIsolation = (req, res, next) => {
    try {

        // All other users must have a tenantId
        if (!req.user.tenantId) {
            throw new ApiError(403, 'User is not associated with any tenant');
        }

        // Add tenantId to request for easy access
        req.tenantId = req.user.tenantId;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to validate tenant access for specific resource
 * Use this when accessing resources that belong to a specific tenant
 */
const validateTenantAccess = (resourceTenantIdField = 'tenantId') => {
    return (req, res, next) => {
        try {

            // Get tenant ID from request body, params, or query
            const resourceTenantId = req.body[resourceTenantIdField] ||
                req.params[resourceTenantIdField] ||
                req.query[resourceTenantIdField];

            // If no tenant ID in resource, use user's tenant ID
            if (!resourceTenantId) {
                req.body[resourceTenantIdField] = req.user.tenantId;
                return next();
            }

            // Verify user's tenant matches resource tenant
            if (resourceTenantId.toString() !== req.user.tenantId.toString()) {
                throw new ApiError(403, 'Access denied. You can only access resources from your tenant.');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware to validate store access
 * Ensures users can only access stores they are assigned to
 */
const validateStoreAccess = async (req, res, next) => {
    try {
        // Get store ID from request (query, body, or params)
        const storeId = (req.params && req.params.storeId) ||
            (req.body && req.body.storeId) ||
            (req.query && req.query.storeId);

        if (!storeId) {
            throw new ApiError(400, 'storeId is required. Please provide storeId in query parameter, request body, or route parameter.');
        }

        // ADMIN can access all stores in their tenant
        if (req.user.role === 'ADMIN') {
            // Verify store exists and belongs to user's tenant (for ADMIN)
            const store = await prisma.store.findUnique({ where: { id: storeId } });
            if (!store) {
                throw new ApiError(404, 'Store not found');
            }

            // ADMIN must access stores within their tenant
            if (req.user.role === 'ADMIN' && store.tenantId.toString() !== req.user.tenantId.toString()) {
                throw new ApiError(403, 'Access denied. Store belongs to different tenant.');
            }

            req.store = store;
            req.storeId = storeId;
            return next();
        }

        // For other roles (STORE_MANAGER, SALES, ACCOUNTANT), check assigned stores
        const hasAccess = req.user.assignedStores?.some(
            assignedStoreId => assignedStoreId.toString() === storeId.toString()
        ) || req.user.defaultStoreId?.toString() === storeId.toString();

        if (!hasAccess) {
            throw new ApiError(403, 'Access denied. You do not have access to this store.');
        }

        // Verify store belongs to user's tenant
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            throw new ApiError(404, 'Store not found');
        }

        if (store.tenantId.toString() !== req.user.tenantId.toString()) {
            throw new ApiError(403, 'Access denied. Store belongs to different tenant.');
        }

        req.store = store;
        req.storeId = storeId;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    tenantIsolation,
    validateTenantAccess,
    validateStoreAccess
};
