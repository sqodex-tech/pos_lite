const { requireModuleAccess } = require('../../src/middleware/rbac.middleware');
const rbacService = require('../../src/services/rbac.service');
const ApiError = require('../../src/utils/ApiError');

jest.mock('../../src/services/rbac.service');

describe('RBAC Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { role: 'SALES', tenantId: 'tenant1', defaultStoreId: 'store1' },
            query: {},
            body: {},
            params: {},
            headers: {}
        };
        res = {};
        next = jest.fn();
    });

    describe('requireModuleAccess', () => {
        it('should return 401 if not authenticated', async () => {
            req.user = null;
            const middleware = requireModuleAccess('inventory', 'view');
            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
        });

        it('should return 403 if access denied', async () => {
            rbacService.hasModuleAccess.mockResolvedValue(false);
            const middleware = requireModuleAccess('inventory', 'create');

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(ApiError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
        });

        it('should call next and set context if access granted', async () => {
            rbacService.hasModuleAccess.mockResolvedValue(true);
            const middleware = requireModuleAccess('inventory', 'view');

            await middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(req.permissionContext).toEqual({ module: 'inventory', action: 'view', storeId: 'store1' });
        });
    });
});
