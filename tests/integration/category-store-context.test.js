const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const Category = require('../../src/models/Category');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Store = require('../../src/models/Store');
const jwt = require('jsonwebtoken');

describe('Category Controller - Store Context Tests', () => {
    let authToken;
    let tenantId;
    let storeId;
    let userId;
    let categoryId;

    beforeAll(async () => {
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
            code: 'TS1',
            status: 'active'
        });
        storeId = store._id;

        // Create test user
        const user = await User.create({
            name: 'Test User',
            email: 'test@user.com',
            password: 'password123',
            role: 'ADMIN',
            tenantId,
            status: 'active'
        });
        userId = user._id;

        // Generate auth token
        authToken = jwt.sign(
            { userId: user._id, tenantId, role: user.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await Category.deleteMany({ tenantId });
        await User.deleteMany({ tenantId });
        await Store.deleteMany({ tenantId });
        await Tenant.deleteMany({ _id: tenantId });
        await mongoose.connection.close();
    });

    describe('POST /api/v1/categories - Store Context', () => {
        it('should create a category with storeId', async () => {
            const response = await request(app)
                .post('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    storeId: storeId.toString(),
                    name: 'Beverages',
                    description: 'Hot and cold drinks',
                    status: 'active'
                });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.name).toBe('Beverages');
            expect(response.body.data.storeId).toBe(storeId.toString());
            categoryId = response.body.data._id;
        });

        it('should return 400 when storeId is missing', async () => {
            const response = await request(app)
                .post('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'No Store Category',
                    description: 'Missing storeId'
                });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Store ID is required');
        });
    });

    describe('GET /api/v1/categories - Store Context', () => {
        it('should get categories filtered by storeId', async () => {
            const response = await request(app)
                .get('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ storeId: storeId.toString(), page: 1, limit: 20 });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].storeId).toBe(storeId.toString());
        });

        it('should return 400 when storeId is missing', async () => {
            const response = await request(app)
                .get('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 20 });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Store ID is required');
        });
    });

    describe('GET /api/v1/categories/tree - Store Context', () => {
        it('should get category tree filtered by storeId', async () => {
            const response = await request(app)
                .get('/api/v1/categories/tree')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ storeId: storeId.toString() });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should return 400 when storeId is missing', async () => {
            const response = await request(app)
                .get('/api/v1/categories/tree')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Store ID is required');
        });
    });

    describe('GET /api/v1/categories/:id - Store Context', () => {
        it('should get category by ID with storeId validation', async () => {
            const response = await request(app)
                .get(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .query({ storeId: storeId.toString() });

            expect(response.status).toBe(200);
            expect(response.body.data._id).toBe(categoryId);
            expect(response.body.data.storeId).toBe(storeId.toString());
        });

        it('should return 400 when storeId is missing', async () => {
            const response = await request(app)
                .get(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Store ID is required');
        });
    });

    describe('PATCH /api/v1/categories/:id - Store Context', () => {
        it('should update category with storeId validation', async () => {
            const response = await request(app)
                .patch(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    storeId: storeId.toString(),
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.description).toBe('Updated description');
        });

        it('should return 400 when storeId is missing', async () => {
            const response = await request(app)
                .patch(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'No store update'
                });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Store ID is required');
        });
    });

    describe('DELETE /api/v1/categories/:id - Store Context', () => {
        it('should return 400 when storeId is missing', async () => {
            const response = await request(app)
                .delete(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Store ID is required');
        });

        it('should soft delete category with storeId validation', async () => {
            const response = await request(app)
                .delete(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .query({ storeId: storeId.toString() });

            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/v1/categories/:id/restore - Store Context', () => {
        it('should return 400 when storeId is missing', async () => {
            const response = await request(app)
                .post(`/api/v1/categories/${categoryId}/restore`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Store ID is required');
        });

        it('should restore category with storeId validation', async () => {
            const response = await request(app)
                .post(`/api/v1/categories/${categoryId}/restore`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ storeId: storeId.toString() });

            expect(response.status).toBe(200);
        });
    });
});
