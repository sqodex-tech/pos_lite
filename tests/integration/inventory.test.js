const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const Item = require('../../src/models/Item');
const Stock = require('../../src/models/Stock');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Store = require('../../src/models/Store');

describe('Inventory API Integration Tests', () => {
    let authToken;
    let tenantId;
    let storeId;
    let itemId;

    beforeAll(async () => {
        // Setup test database connection
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sumboxpro_test');
        
        // Create test tenant
        const tenant = await Tenant.create({
            name: 'Test Tenant',
            email: 'test@tenant.com',
            status: 'active'
        });
        tenantId = tenant._id;

        // Create test store
        const store = await Store.create({
            tenantId,
            name: 'Test Store',
            code: 'TEST-001',
            address: '123 Test St',
            phone: '+1234567890',
            status: 'active'
        });
        storeId = store._id;

        // Create test user
        const user = await User.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'ADMIN',
            tenantId
        });

        // Login to get token
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'password123'
            });
        
        authToken = loginRes.body.data.accessToken;
    });

    afterAll(async () => {
        // Cleanup
        await Item.deleteMany({});
        await Stock.deleteMany({});
        await Store.deleteMany({});
        await User.deleteMany({});
        await Tenant.deleteMany({});
        await mongoose.connection.close();
    });

    describe('POST /api/v1/inventory', () => {
        it('should create a new inventory item', async () => {
            const res = await request(app)
                .post('/api/v1/inventory')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Product',
                    barcode: 'TEST-001',
                    purchasePrice: 10.00,
                    salePrice: 15.00,
                    lowStockAlert: 5,
                    status: 'active'
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.name).toBe('Test Product');
            
            itemId = res.body.data._id;
        });

        it('should enforce subscription limits', async () => {
            // This would require setting up subscription with maxItems limit
            // and creating items up to that limit
        });
    });

    describe('GET /api/v1/inventory/stock/:storeId', () => {
        it('should get stock levels for a store', async () => {
            // First add some stock
            await Stock.create({
                tenantId,
                storeId,
                itemId,
                quantity: 50
            });

            const res = await request(app)
                .get(`/api/v1/inventory/stock/${storeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('should filter low stock items', async () => {
            const res = await request(app)
                .get(`/api/v1/inventory/stock/${storeId}?lowStockOnly=true`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeInstanceOf(Array);
        });
    });

    describe('POST /api/v1/inventory/stock/:storeId/:itemId/adjust', () => {
        it('should adjust stock quantity', async () => {
            const res = await request(app)
                .post(`/api/v1/inventory/stock/${storeId}/${itemId}/adjust`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    quantity: 100,
                    reason: 'Initial stock count',
                    notes: 'Setting up inventory'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.quantity).toBe(100);
        });

        it('should require reason for adjustment', async () => {
            const res = await request(app)
                .post(`/api/v1/inventory/stock/${storeId}/${itemId}/adjust`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    quantity: 100
                });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toContain('reason');
        });
    });

    describe('POST /api/v1/inventory/stock/transfer', () => {
        let store2Id;

        beforeAll(async () => {
            const store2 = await Store.create({
                tenantId,
                name: 'Test Store 2',
                code: 'TEST-002',
                address: '456 Test Ave',
                phone: '+1234567891',
                status: 'active'
            });
            store2Id = store2._id;
        });

        it('should transfer stock between stores', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/stock/transfer')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    fromStoreId: storeId,
                    toStoreId: store2Id,
                    itemId,
                    quantity: 20,
                    notes: 'Restocking store 2'
                });

            expect(res.status).toBe(200);
            expect(res.body.data.success).toBe(true);
        });

        it('should not allow transfer to same store', async () => {
            const res = await request(app)
                .post('/api/v1/inventory/stock/transfer')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    fromStoreId: storeId,
                    toStoreId: storeId,
                    itemId,
                    quantity: 10
                });

            expect(res.status).toBe(400);
            expect(res.body.error.message).toContain('same store');
        });
    });
});
