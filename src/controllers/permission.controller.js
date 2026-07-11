const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { MODULES, MODULE_ACTIONS, DEFAULT_ROLE_MODULE_PERMISSIONS, ROLE_PERMISSIONS, ROLES, PERMISSIONS } = require('../utils/rolePermissions');
const logger = require('../utils/logger');
const rbacService = require('../services/rbac.service');

/**
 * @desc Get legacy flat permissions (backward compatibility)
 */
exports.getAllPermissions = async (req, res, next) => {
    try {
        res.status(200).json(new ApiResponse(200, {
            permissions: PERMISSIONS,
            roles: ROLES,
            rolePermissions: ROLE_PERMISSIONS,
            modules: MODULES,
            moduleActions: MODULE_ACTIONS
        }, 'Permissions retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get permission matrix for a store
 * @route GET /api/v1/permissions/matrix?storeId=XYZ
 */
exports.getStorePermissionMatrix = async (req, res, next) => {
    try {
        const { storeId } = req.query;
        if (!storeId) throw new ApiError(400, 'storeId query parameter is required');

        // Verify access to store
        if (req.user.role !== 'ADMIN') {
            const store = await prisma.store.findFirst({
                where: { id: storeId, tenantId: req.user.tenantId }
            });
            if (!store) throw new ApiError(403, 'Access denied to this store');
        }

        const tenantId = req.user.tenantId;

        const roles = ['ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT'];
        const matrix = {};

        for (const role of roles) {
            matrix[role] = await rbacService.getEffectivePermissions(tenantId, storeId, role);
        }

        res.status(200).json(new ApiResponse(200, matrix, 'Permission matrix retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get permissions for a specific role in a store
 * @route GET /api/v1/permissions/roles/:role?storeId=XYZ
 */
exports.getRolePermissions = async (req, res, next) => {
    try {
        const { role } = req.params;
        const { storeId } = req.query;
        if (!storeId) throw new ApiError(400, 'storeId query parameter is required');

        const tenantId = req.user.tenantId;
        const permissions = await rbacService.getEffectivePermissions(tenantId, storeId, role.toUpperCase());

        res.status(200).json(new ApiResponse(200, permissions, 'Role permissions retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Batch set actions for a role & module
 * @route PATCH /api/v1/permissions/roles/:role/modules/:module?storeId=XYZ
 */
exports.setModuleActions = async (req, res, next) => {
    try {
        const { role, module } = req.params;
        const { storeId } = req.query;
        const { actions } = req.body;

        if (!storeId) throw new ApiError(400, 'storeId query parameter is required');
        if (!actions || !Array.isArray(actions)) throw new ApiError(400, 'actions array is required');

        const tenantId = req.user.tenantId;

        // Verify access to store
        if (req.user.role !== 'ADMIN') {
            const store = await prisma.store.findFirst({
                where: { id: storeId, tenantId: req.user.tenantId }
            });
            if (!store) throw new ApiError(403, 'Access denied to this store');
        }

        const updatedActions = await rbacService.setModuleActions(tenantId, storeId, role.toUpperCase(), module, actions, req.user, req);

        res.status(200).json(new ApiResponse(200, updatedActions, 'Module actions updated successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Grant single action
 * @route POST /api/v1/permissions/roles/:role/modules/:module/grant?storeId=XYZ
 */
exports.grantAction = async (req, res, next) => {
    try {
        const { role, module } = req.params;
        const { storeId } = req.query;
        const { action } = req.body;

        if (!storeId) throw new ApiError(400, 'storeId query parameter is required');
        if (!action) throw new ApiError(400, 'action is required');

        const tenantId = req.user.tenantId;
        const updatedActions = await rbacService.grantAction(tenantId, storeId, role.toUpperCase(), module, action, req.user, req);

        res.status(200).json(new ApiResponse(200, updatedActions, `Granted ${action} to ${role} on ${module}`));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Revoke single action
 * @route POST /api/v1/permissions/roles/:role/modules/:module/revoke?storeId=XYZ
 */
exports.revokeAction = async (req, res, next) => {
    try {
        const { role, module } = req.params;
        const { storeId } = req.query;
        const { action } = req.body;

        if (!storeId) throw new ApiError(400, 'storeId query parameter is required');
        if (!action) throw new ApiError(400, 'action is required');

        const tenantId = req.user.tenantId;
        const updatedActions = await rbacService.revokeAction(tenantId, storeId, role.toUpperCase(), module, action, req.user, req);

        res.status(200).json(new ApiResponse(200, updatedActions, `Revoked ${action} from ${role} on ${module}`));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Reset role to defaults
 * @route POST /api/v1/permissions/roles/:role/reset?storeId=XYZ
 */
exports.resetRoleDefaults = async (req, res, next) => {
    try {
        const { role } = req.params;
        const { storeId } = req.query;
        if (!storeId) throw new ApiError(400, 'storeId query parameter is required');

        const tenantId = req.user.tenantId;
        await rbacService.resetToDefaults(tenantId, storeId, role.toUpperCase(), req.user, req);

        res.status(200).json(new ApiResponse(200, null, `Role ${role} reset to system defaults`));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Paginated Audit Log
 * @route GET /api/v1/permissions/audit-log?storeId=XYZ
 */
exports.getAuditLog = async (req, res, next) => {
    try {
        const { storeId, role, module, from, to, page, limit } = req.query;
        if (!storeId) throw new ApiError(400, 'storeId query parameter is required');

        // Verify access to store
        if (req.user.role !== 'ADMIN') {
            const store = await prisma.store.findFirst({
                where: { id: storeId, tenantId: req.user.tenantId }
            });
            if (!store) throw new ApiError(403, 'Access denied to this store');
        }

        const logResult = await rbacService.getAuditLog(
            req.user.tenantId,
            storeId,
            { role, module, from, to },
            { page, limit }
        );

        res.status(200).json(new ApiResponse(200, logResult.logs, 'Audit log retrieved', {
            total: logResult.total,
            page: logResult.page,
            totalPages: logResult.totalPages
        }));
    } catch (error) {
        next(error);
    }
};

// ========================
// Legacy Methods below keeping them so existing frontend/mobile doesn't break
// ========================

exports.getUserPermissions = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, tenantId: true, permissions: true, customPermissions: true, permissionOverrides: true }
        });

        if (!user) throw new ApiError(404, 'User not found');
        if (user.tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }
        res.status(200).json(new ApiResponse(200, {
            user: { _id: user.id, name: user.name, email: user.email, role: user.role },
            permissions: user.permissions || [],
            rolePermissions: user.permissions || [],
            customPermissions: user.customPermissions || [],
            permissionOverrides: user.permissionOverrides || { granted: [], revoked: [] }
        }, 'User permissions retrieved successfully'));
    } catch (error) { next(error); }
};

exports.updateUserPermissions = async (req, res, next) => {
    res.status(200).json(new ApiResponse(200, {}, 'User legacy permissions endpoint deprecated'));
};

exports.resetUserPermissions = async (req, res, next) => {
    res.status(200).json(new ApiResponse(200, {}, 'User legacy permissions endpoint deprecated'));
};

exports.bulkUpdatePermissions = async (req, res, next) => {
    res.status(200).json(new ApiResponse(200, {}, 'User legacy permissions endpoint deprecated'));
};

module.exports = exports;
