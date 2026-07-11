const rbacService = require('../../src/services/rbac.service');
const RolePermission = require('../../src/models/RolePermission');
const PermissionAuditLog = require('../../src/models/PermissionAuditLog');
const cacheService = require('../../src/utils/cache.service');
const { MODULES, DEFAULT_ROLE_MODULE_PERMISSIONS } = require('../../src/utils/rolePermissions');

jest.mock('../../src/models/RolePermission');
jest.mock('../../src/models/PermissionAuditLog');
jest.mock('../../src/utils/cache.service');

describe('RbacService', () => {
    const tenantId = 'tenant123';
    const storeId = 'store123';
    const adminUser = { _id: 'admin123', email: 'admin@test.com' };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getEffectivePermissions', () => {
        it('should return default permissions if none found in DB', async () => {
            cacheService.get.mockReturnValue(null);
            RolePermission.find.mockResolvedValue([]);

            const result = await rbacService.getEffectivePermissions(tenantId, storeId, 'SALES');

            expect(result).toEqual(DEFAULT_ROLE_MODULE_PERMISSIONS['SALES']);
            expect(cacheService.set).toHaveBeenCalled();
        });

        it('should return cached permissions if available', async () => {
            const cachedPerms = { [MODULES.INVENTORY]: ['view'] };
            cacheService.get.mockReturnValue(cachedPerms);

            const result = await rbacService.getEffectivePermissions(tenantId, storeId, 'SALES');

            expect(result).toEqual(cachedPerms);
            expect(RolePermission.find).not.toHaveBeenCalled();
        });
    });

    describe('hasModuleAccess', () => {
        it('should return true for SUPER_ADMIN always', async () => {
            const result = await rbacService.hasModuleAccess(tenantId, storeId, 'SUPER_ADMIN', MODULES.INVENTORY, 'view');
            expect(result).toBe(true);
        });

        it('should return true if role has the specific action', async () => {
            cacheService.get.mockReturnValue({ [MODULES.INVENTORY]: ['view', 'create'] });

            const result = await rbacService.hasModuleAccess(tenantId, storeId, 'SALES', MODULES.INVENTORY, 'view');

            expect(result).toBe(true);
        });

        it('should return false if role missing action', async () => {
            cacheService.get.mockReturnValue({ [MODULES.INVENTORY]: ['view'] });

            const result = await rbacService.hasModuleAccess(tenantId, storeId, 'SALES', MODULES.INVENTORY, 'create');

            expect(result).toBe(false);
        });
    });

    describe('grantAction', () => {
        it('should add action and clear cache', async () => {
            RolePermission.findOne.mockResolvedValue({
                actions: ['view']
            });
            RolePermission.findOneAndUpdate.mockResolvedValue({});
            PermissionAuditLog.create.mockResolvedValue({});

            const result = await rbacService.grantAction(tenantId, storeId, 'SALES', MODULES.INVENTORY, 'create', adminUser, {});

            expect(result).toContain('create');
            expect(result).toContain('view');
            expect(cacheService.del).toHaveBeenCalledWith(`perm:${tenantId}:${storeId}:SALES`);
            expect(PermissionAuditLog.create).toHaveBeenCalled();
        });
    });
});
