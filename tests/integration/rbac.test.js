const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Store = require('../../src/models/Store');
const RolePermission = require('../../src/models/RolePermission');
const { generateToken } = require('../../src/utils/jwt.utils');

describe('RBAC Integration Tests', () => {
    let adminToken, salesToken, adminUser, salesUser, store;

    // We must generate object IDs string for consistency if tenantId is used as string
    const tenantId = new mongoose.Types.ObjectId().toString();

    beforeAll(async () => {
        // Create test store
        store = await Store.create({
            name: 'Test Store Integration',
            tenantId,
            status: 'active'
        });

        // Create Admin
        adminUser = await User.create({
            name: 'Admin User',
            email: 'admin_integ@test.com',
            password: 'password123',
            role: 'ADMIN',
            tenantId,
            defaultStoreId: store._id
        });
        adminToken = generateToken(adminUser);

        // Create Sales User
        salesUser = await User.create({
            name: 'Sales User',
            email: 'sales_integ@test.com',
            password: 'password123',
            role: 'SALES',
            tenantId,
            defaultStoreId: store._id
        });
        salesToken = generateToken(salesUser);
    });

    afterAll(async () => {
        await User.deleteMany({ tenantId });
        await Store.deleteMany({ tenantId });
        await RolePermission.deleteMany({ tenantId });
    });

    it('should seed default permissions on store creation', async () => {
        const newStoreResponse = await request(app)
            .post('/api/v1/stores')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Another Store', location: 'NYC' });

        expect(newStoreResponse.status).toBe(201);

        const newStoreId = newStoreResponse.body.data._id;
        const permissionsForSales = await RolePermission.findOne({
            storeId: newStoreId,
            role: 'SALES',
            module: 'inventory'
        });

        expect(permissionsForSales).toBeDefined();
        expect(permissionsForSales.actions).toContain('view');
    });

    it('sales user should be able to view inventory natively', async () => {
        const res = await request(app)
            .get('/api/v1/inventory')
            .set('Authorization', `Bearer ${salesToken}`)
            .set('x-store-id', store._id.toString());

        // Assuming no implementation errors, the middleware should pass.
        // It's normal to get 200 (ok) or 404/400 depends on DB state, but NOT 403.
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });

    it('admin should be able to revoke inventory view from sales', async () => {
        const revokeRes = await request(app)
            .post(`/api/v1/permissions/roles/SALES/modules/inventory/revoke?storeId=${store._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'view' });

        expect(revokeRes.status).toBe(200);

        // Sales should now be blocked
        const res = await request(app)
            .get('/api/v1/inventory')
            .set('Authorization', `Bearer ${salesToken}`)
            .set('x-store-id', store._id.toString());

        expect(res.status).toBe(403);
    });
});
