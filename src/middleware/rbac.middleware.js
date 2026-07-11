const ApiError = require('../utils/ApiError');
const rbacService = require('../services/rbac.service');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, `User role ${req.user.role} is not authorized to access this resource`));
        }
        next();
    };
};

const requireModuleAccess = (moduleName, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.tenantId) {
                return next(new ApiError(401, 'Authentication context missing. Please login again.'));
            }

            const { role, tenantId, defaultStoreId } = req.user;

            // SUPER_ADMIN bypasses all store-scoped RBAC
            if (role === 'SUPER_ADMIN') {
                return next();
            }

            // Priority for store selection:
            // 1. Explicit storeId in query/body/params/headers
            // 2. User's defaultStoreId (safe check)
            let storeId = req.query?.storeId ||
                req.body?.storeId ||
                req.params?.storeId ||
                req.headers?.['x-store-id'] ||
                defaultStoreId;

            // SPECIAL CASE: Listing or creating stores/staff doesn't require a store context yet.
            // It's a tenant-level operation.
            const isGlobalModule = ['stores', 'tenants', 'staff'].includes(moduleName);
            
            if (!storeId && !isGlobalModule) {
                return next(new ApiError(400, 'Store context required. Please select a store.'));
            }

            const hasAccess = await rbacService.hasModuleAccess(tenantId, storeId, role, moduleName, action);

            if (!hasAccess) {
                const contextMsg = storeId ? `in the active store` : `for the tenant`;
                return next(new ApiError(403, `Access denied: Missing '${action}' permission for '${moduleName}' module ${contextMsg}`));
            }

            // Attach context for downstream controllers if they need it
            req.permissionContext = { module: moduleName, action, storeId };

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { authorize, requireModuleAccess };
