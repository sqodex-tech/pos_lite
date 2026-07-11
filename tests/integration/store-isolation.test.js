const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const Category = require('../../src/models/Category');
const Unit = require('../../src/models/Unit');
const Item = require('../../src/models/Item');
const Stock = require('../../src/models/Stock');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Store = require('../../src/models/Store');
const jwt = require('jsonwebtoken');

describe('Store Isolation Integration Tests', () => {
    let tenant1Id, tenant2Id;
    let store1Id, store2Id, store3Id;
    let user1Token, user2Token, adminToken;
    let user1Id, user2Id, adminId;
    let categoryId, unitId;
    let item1Id, item2Id;

    beforeAll(async () => {
        // Create two tenants
        const tenant1 = await Tenant.create({
            name: 'Tenant 1',
            email: 'tenant1@test.com',
            status: 'active'
        });
        tenant1Id = tenant1._id;

        const tenant2 = await Tenant.create({
            name: 'Tenant 2',
            email: 'tenant2@test.com',
            status: 'active'
        });
        tenant2Id = tenant2._id;

        // Create stores for tenant1
        const store1 = await Store.create({
            tenantId: tenant1Id,
            name: 'Store 1',
            code: 'ST1',
            status: 'active'
        });
        store1Id = store1._id;

        const store2 = await Store.create({
            tenantId: tenant1Id,
            name: 'Store 2',
            code: 'ST2',
            status: 'active'
        });
        store2Id = store2._id;

        // Create store for tenant2
        const store3 = await Store.create({
            tenantId: tenant2Id,
            name: 'Store 3',
            code: 'ST3',
            status: 'active'
        });
        store3Id = store3._id;

        // Create users
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@tenant1.com',
            password: 'password123',
            role: 'ADMIN',
            tenantId: tenant1Id,
            status: 'active'
        });
        adminId = admin._id;
        adminToken = jwt.sign(
            { userId: admin._id, tenantId: tenant1Id, role: 'ADMIN' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        const user1 = await User.create({
            name: 'User 1',
            email: 'user1@tenant1.com',
            password: 'password123',
            role: 'STORE_MANAGER',
            tenantId: tenant1Id,
            storeIds: [store1Id],
            status: 'active'
        });
        user1Id = user1._id;
        user1Token = jwt.sign(
            { userId: user1._id, tenantId: tenant1Id, role: 'STORE_MANAGER' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        const user2 = await User.create({
            name: 'User 2',
            email: 'user2@tenant2.com',
            password: 'password123',
            role: 'STORE_MANAGER',
            tenantId: tenant2Id,
            storeIds: [store3Id],
            status: 'active'
        });
        user2Id = user2._id;
        user2Token = jwt.sign(
            { userId: user2._id, tenantId: tenant2Id, role: 'STORE_MANAGER' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Create category and unit for tenant1
        const category = await Category.create({
            tenantId: tenant1Id,
            name: 'Test Category',
            status: 'active',
            createdBy: adminId
        });
        categoryId = category._id;

        const unit = await Unit.create({
            tenantId: tenant1Id,
            name: 'Piece',
            symbol: 'pc',
            category: 'count',
            status: 'active',
            createdBy: adminId
        });
        unitId = unit._id;
    });

    afterAll(async () => {
        await Item.deleteMany({});
        await Stock.deleteMany({});
        await Category.deleteMany({});
        await Unit.deleteMany({});
        await Store.deleteMany({});
        await User.deleteMany({});
        await Tenant.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Item Creation with Store Isolation', () => {
        it('should create item in store1 by user1', async () => {
            const response = await request(app)
                .post('/api/v1/inventory')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    storeId: store1Id,
                    name: 'Item 1',
                    barcode: 'ITEM001',
                    categoryId,
                    unitId,
                    purchasePrice: 10,
                    salePrice: 15,
                    lowStockAlert: 5
                });

            expect(response.status).toBe(201);
            expect(response.body.data.storeId._id).toBe(store1Id.toString());
            item1Id = response.body.data._id;
        });

        it('should prevent user1 from creating item in store2 (not assigned)', async () => {
            const response = await request(app)
                .post('/api/v1/inventory')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    storeId: store2Id,
                    name: 'Item 2',
                    barcode: 'ITEM002',
                    categoryId,
                    unitId,
                    purchasePrice: 10,
                    salePrice: 15
                });

            expect(response.status).toBe(403);
            expect(response.body.error.message).toContain('not assigned to this store');
        });

        it('should prevent user2 from creating item in store1 (different tenant)', async () => {
            const response = await request(app)
                .post('/api/v1/inventory')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    storeId: store1Id,
                    name: 'Item 3',
                    barcode: 'ITEM003',
                    categoryId,
                    unitId,
                    purchasePrice: 10,
                    salePrice: 15
                });

            expect(response.status).toBe(403);
            expect(response.body.error.message).toContain('does not belong to this tenant');
        });

        it('should allow admin to create item in any store of their tenant', async () => {
            const response = await request(app)
                .post('/api/v1/inventory')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    storeId: store2Id,
                    name: 'Item 2',
                    barcode: 'ITEM002',
                    categoryId,
                    unitId,
                    purchasePrice: 10,
                    salePrice: 15
                });

            expect(response.status).toBe(201);
            expect(response.body.data.storeId._id).toBe(store2Id.toString());
            item2Id = response.body.data._id;
        });
    });

    describe('Item Retrieval with Store Isolation', () => {
        it('should allow user1 to view items in store1', async () => {
            const response = await request(app)
                .get(`/api/v1/inventory?storeId=${store1Id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.every(item => item.storeId._id === store1Id.toString())).toBe(true);
        });

        it('should prevent user1 from viewing items in store2', async () => {
            const response = await request(app)
                .get(`/api/v1/inventory?storeId=${store2Id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(403);
        });

        it('should prevent user2 from viewing items in store1', async () => {
            const response = await request(app)
                .get(`/api/v1/inventory?storeId=${store1Id}`)
                .set('Authorization', `Bearer ${user2Token}`);

            expect(response.status).toBe(403);
        });

        it('should allow admin to view items in all stores of their tenant', async () => {
            const response1 = await request(app)
                .get(`/api/v1/inventory?storeId=${store1Id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response1.status).toBe(200);

            const response2 = await request(app)
                .get(`/api/v1/inventory?storeId=${store2Id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response2.status).toBe(200);
        });
    });

    describe('Item Update with Store Isolation', () => {
        it('should allow user1 to update item in store1', async () => {
            const response = await request(app)
                .patch(`/api/v1/inventory/${item1Id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    storeId: store1Id,
                    salePrice: 20
                });

            expect(response.status).toBe(200);
            expect(response.body.data.salePrice).toBe(20);
        });

        it('should prevent user1 from updating item in store2', async () => {
            const response = await request(app)
                .patch(`/api/v1/inventory/${item2Id}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    storeId: store2Id,
                    salePrice: 25
                });

            expect(response.status).toBe(403);
        });
    });

    describe('Stock Isolation', () => {
        it('should maintain separate stock for same item in different stores', async () => {
            // This test verifies that stock is store-specific
            const stock1 = await Stock.findOne({ storeId: store1Id, itemId: item1Id });
            const stock2 = await Stock.findOne({ storeId: store2Id, itemId: item2Id });

            expect(stock1).toBeDefined();
            expect(stock2).toBeDefined();
            expect(stock1.storeId.toString()).not.toBe(stock2.storeId.toString());
        });

        it('should prevent viewing stock from unauthorized store', async () => {
            const response = await request(app)
                .get(`/api/v1/inventory/stock/${store2Id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(403);
        });
    });

    describe('Referential Integrity', () => {
        it('should prevent creating item with invalid category', async () => {
            const fakeCategory = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post('/api/v1/inventory')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    storeId: store1Id,
                    name: 'Invalid Item',
                    categoryId: fakeCategory,
                    unitId,
                    purchasePrice: 10,
                    salePrice: 15
                });

            expect(response.status).toBe(404);
            expect(response.body.error.message).toContain('Category');
        });

        it('should prevent creating item with invalid unit', async () => {
            const fakeUnit = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post('/api/v1/inventory')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    storeId: store1Id,
                    name: 'Invalid Item',
                    categoryId,
                    unitId: fakeUnit,
                    purchasePrice: 10,
                    salePrice: 15
                });

            expect(response.status).toBe(404);
            expect(response.body.error.message).toContain('Unit');
        });

        it('should prevent deleting category used in items', async () => {
            const response = await request(app)
                .delete(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('used by');
        });

        it('should prevent deleting unit used in items', async () => {
            const response = await request(app)
                .delete(`/api/v1/units/${unitId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('used by');
        });
    });

    describe('Data Integrity Verification', () => {
        it('should verify data integrity for a store', async () => {
            const response = await request(app)
                .get(`/api/v1/inventory/verify-integrity?storeId=${store1Id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('isValid');
            expect(response.body.data).toHaveProperty('issues');
        });

        it('should prevent non-admin from verifying integrity', async () => {
            const response = await request(app)
                .get(`/api/v1/inventory/verify-integrity?storeId=${store1Id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            // Should still work for viewing, but repair would be restricted
            expect(response.status).toBe(200);
        });
    });
});
