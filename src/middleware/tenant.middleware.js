const ApiError = require('../utils/ApiError');

/**
 * Middleware to extract tenantId from the user object (set by auth middleware)
 * and ensure it's available for all downstream database operations.
 * This reinforces row-level security.
 */
const tenantContext = (req, res, next) => {
    if (!req.user || !req.user.tenantId) {
        return next(new ApiError(401, 'Tenant context missing. Authentication required.'));
    }

    // Attach tenantId to the request for easy access in controllers/services
    req.tenantId = req.user.tenantId;
    next();
};

module.exports = tenantContext;
