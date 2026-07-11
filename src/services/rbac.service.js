const prisma = require('../config/prisma');
const { MODULES, MODULE_ACTIONS, DEFAULT_ROLE_MODULE_PERMISSIONS } = require('../utils/rolePermissions');
const cacheService = require('../utils/cache.service');

const CACHE_TTL = 300; // 5 minutes

class RbacService {
    _getCacheKey(tenantId, storeId, role) {
        return `perm:${tenantId}:${storeId}:${role}`;
    }

    async getEffectivePermissions(tenantId, storeId, role) {
        if (!storeId) {
            return DEFAULT_ROLE_MODULE_PERMISSIONS[role] || {};
        }

        const cacheKey = this._getCacheKey(tenantId, storeId, role);
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        const perms = await prisma.rolePermission.findMany({
            where: { tenantId, storeId, role }
        });

        let effective = {};
        if (perms.length === 0) {
            // Fallback to defaults if not seeded yet
            effective = DEFAULT_ROLE_MODULE_PERMISSIONS[role] || {};
        } else {
            perms.forEach(p => {
                // Parse JSON array if needed, Prisma returns JSON as objects/arrays
                effective[p.module] = p.actions || [];
            });
        }

        cacheService.set(cacheKey, effective, CACHE_TTL);
        return effective;
    }

    async hasModuleAccess(tenantId, storeId, role, module, action) {
        // All other roles — including ADMIN — are fully customisable by the tenant.
        // Permissions are looked up from the DB (seeded on store creation, editable via
        // PATCH /permissions/roles/:role/modules/:module).

        const permissions = await this.getEffectivePermissions(tenantId, storeId, role);
        if (!permissions[module]) return false;

        return permissions[module].includes(action);
    }

    async seedStoreDefaults(tenantId, storeId) {
        try {
            const existing = await prisma.rolePermission.findFirst({
                where: { tenantId, storeId }
            });
            if (existing) return; // Already seeded

            const defaultDocs = [];
            for (const [role, modules] of Object.entries(DEFAULT_ROLE_MODULE_PERMISSIONS)) {
                for (const [moduleName, actions] of Object.entries(modules)) {
                    defaultDocs.push({
                        tenantId,
                        storeId,
                        role,
                        module: moduleName,
                        actions: [...actions],
                        isDefault: true
                    });
                }
            }

            if (defaultDocs.length > 0) {
                await prisma.rolePermission.createMany({
                    data: defaultDocs
                });
            }
        } catch (error) {
            const logger = require('../utils/logger');
            logger.error(`Failed to seed permissions for store ${storeId}: ${error.message}`);
        }
    }

    async _logAudit(tenantId, storeId, adminUser, targetRole, module, action, permission, previousState, newState, req) {
        const ipAddress = req?.ip || req?.connection?.remoteAddress;
        const userAgent = req?.headers?.['user-agent'];

        await prisma.permissionAuditLog.create({
            data: {
                tenantId,
                storeId,
                adminId: adminUser.id,
                adminEmail: adminUser.email,
                targetRole,
                module,
                action,
                permission,
                previousState: previousState ? JSON.stringify(previousState) : null,
                newState: newState ? JSON.stringify(newState) : null,
                ipAddress,
                userAgent
            }
        });
    }

    async setModuleActions(tenantId, storeId, role, module, actions, adminUser, req) {
        if (!Object.values(MODULES).includes(module)) {
            throw new Error(`Invalid module: ${module}`);
        }

        const validActions = MODULE_ACTIONS[module] || [];
        const invalidActions = actions.filter(a => !validActions.includes(a));
        if (invalidActions.length > 0) {
            const ApiError = require('../utils/ApiError');
            throw new ApiError(400, `Invalid actions for module ${module}: ${invalidActions.join(', ')}`);
        }

        const currentPerm = await prisma.rolePermission.findFirst({
            where: { tenantId, storeId, role, module }
        });
        const previousState = currentPerm ? currentPerm.actions : (DEFAULT_ROLE_MODULE_PERMISSIONS[role]?.[module] || []);

        if (currentPerm) {
            await prisma.rolePermission.update({
                where: { id: currentPerm.id },
                data: {
                    actions,
                    isDefault: false
                }
            });
        } else {
            await prisma.rolePermission.create({
                data: {
                    tenantId,
                    storeId,
                    role,
                    module,
                    actions,
                    isDefault: false
                }
            });
        }

        cacheService.del(this._getCacheKey(tenantId, storeId, role));

        await this._logAudit(tenantId, storeId, adminUser, role, module, 'set', null, previousState, actions, req);

        return actions;
    }

    async grantAction(tenantId, storeId, role, module, action, adminUser, req) {
        const currentPerm = await prisma.rolePermission.findFirst({
            where: { tenantId, storeId, role, module }
        });
        let actions = currentPerm ? [...currentPerm.actions] : (DEFAULT_ROLE_MODULE_PERMISSIONS[role]?.[module] || []);
        const previousState = [...actions];

        if (!actions.includes(action)) {
            const validActions = MODULE_ACTIONS[module] || [];
            if (!validActions.includes(action)) {
                const ApiError = require('../utils/ApiError');
                throw new ApiError(400, `Invalid action ${action} for module ${module}`);
            }
            actions.push(action);

            if (currentPerm) {
                await prisma.rolePermission.update({
                    where: { id: currentPerm.id },
                    data: { actions, isDefault: false }
                });
            } else {
                await prisma.rolePermission.create({
                    data: {
                        tenantId,
                        storeId,
                        role,
                        module,
                        actions,
                        isDefault: false
                    }
                });
            }

            cacheService.del(this._getCacheKey(tenantId, storeId, role));
            await this._logAudit(tenantId, storeId, adminUser, role, module, 'grant', action, previousState, actions, req);
        }

        return actions;
    }

    async revokeAction(tenantId, storeId, role, module, action, adminUser, req) {
        const currentPerm = await prisma.rolePermission.findFirst({
            where: { tenantId, storeId, role, module }
        });
        let actions = currentPerm ? [...currentPerm.actions] : (DEFAULT_ROLE_MODULE_PERMISSIONS[role]?.[module] || []);
        const previousState = [...actions];

        if (actions.includes(action)) {
            actions = actions.filter(a => a !== action);

            if (currentPerm) {
                await prisma.rolePermission.update({
                    where: { id: currentPerm.id },
                    data: { actions, isDefault: false }
                });
            } else {
                await prisma.rolePermission.create({
                    data: {
                        tenantId,
                        storeId,
                        role,
                        module,
                        actions,
                        isDefault: false
                    }
                });
            }

            cacheService.del(this._getCacheKey(tenantId, storeId, role));
            await this._logAudit(tenantId, storeId, adminUser, role, module, 'revoke', action, previousState, actions, req);
        }

        return actions;
    }

    async resetToDefaults(tenantId, storeId, role, adminUser, req) {
        await prisma.rolePermission.deleteMany({
            where: { tenantId, storeId, role }
        });

        // Re-seed defaults for this role
        const defaultDocs = [];
        const defaults = DEFAULT_ROLE_MODULE_PERMISSIONS[role] || {};
        for (const [moduleName, actions] of Object.entries(defaults)) {
            defaultDocs.push({
                tenantId,
                storeId,
                role,
                module: moduleName,
                actions: [...actions],
                isDefault: true
            });
        }

        if (defaultDocs.length > 0) {
            await prisma.rolePermission.createMany({
                data: defaultDocs
            });
        }

        cacheService.del(this._getCacheKey(tenantId, storeId, role));

        // Audit log entry for reset
        await this._logAudit(tenantId, storeId, adminUser, role, 'ALL', 'reset', null, [], [], req);
    }

    async getAuditLog(tenantId, storeId, filters = {}, pagination = { page: 1, limit: 20 }) {
        const where = { tenantId, storeId };
        if (filters.role) where.targetRole = filters.role;
        if (filters.module) where.module = filters.module;
        if (filters.from || filters.to) {
            where.timestamp = {};
            if (filters.from) where.timestamp.gte = new Date(filters.from);
            if (filters.to) where.timestamp.lte = new Date(filters.to);
        }

        const limit = parseInt(pagination.limit, 10) || 20;
        const page = parseInt(pagination.page, 10) || 1;
        const skip = (page - 1) * limit;

        const logs = await prisma.permissionAuditLog.findMany({
            where,
            include: {
                admin: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { timestamp: 'desc' }, // Assuming the field is timestamp or createdAt
            skip,
            take: limit
        });

        const total = await prisma.permissionAuditLog.count({ where });

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
}

module.exports = new RbacService();
