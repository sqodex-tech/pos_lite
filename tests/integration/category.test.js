const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const Category = require('../../src/models/Category');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const jwt = require('jsonwebtoken');

describe('Category API Integration Tests', () => {
    let authToken;
    let tenantId;
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
        await Tenant.deleteMany({ _id: tenantId });
        await mongoose.connection.close();
    });

    describe('POST /api/v1/categories', () => {
        it('should create a new category', async () => {
            const response = await request(app)
                .post('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Beverages',
                    description: 'Hot and cold drinks',
                    icon: 'coffee',
                    color: '#FF5733',
                    status: 'active'
                });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data.name).toBe('Beverages');
            categoryId = response.body.data._id;
        });

        it('should not create duplicate category', async () => {
            const response = await request(app)
                .post('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Beverages',
                    description: 'Duplicate'
                });

            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('already exists');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'Missing name'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/v1/categories', () => {
        it('should get all categories with pagination', async () => {
            const response = await request(app)
                .get('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 20 });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toHaveProperty('total');
            expect(response.body.meta).toHaveProperty('page');
        });

        it('should filter by status', async () => {
            const response = await request(app)
                .get('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ status: 'active' });

            expect(response.status).toBe(200);
            expect(response.body.data.every(cat => cat.status === 'active')).toBe(true);
        });

        it('should search categories', async () => {
            const response = await request(app)
                .get('/api/v1/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ search: 'Bever' });

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/v1/categories/tree', () => {
        it('should get category tree structure', async () => {
            const response = await request(app)
                .get('/api/v1/categories/tree')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('GET /api/v1/categories/:id', () => {
        it('should get category by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data._id).toBe(categoryId);
        });

        it('should return 404 for non-existent category', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/v1/categories/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /api/v1/categories/:id', () => {
        it('should update category', async () => {
            const response = await request(app)
                .patch(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'Updated description',
                    color: '#00FF00'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.description).toBe('Updated description');
        });
    });

    describe('DELETE /api/v1/categories/:id', () => {
        it('should soft delete category', async () => {
            const response = await request(app)
                .delete(`/api/v1/categories/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);

            // Verify soft delete
            const category = await Category.findById(categoryId);
            expect(category.deletedAt).not.toBeNull();
        });
    });

    describe('POST /api/v1/categories/:id/restore', () => {
        it('should restore deleted category', async () => {
            const response = await request(app)
                .post(`/api/v1/categories/${categoryId}/restore`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);

            // Verify restoration
            const category = await Category.findById(categoryId);
            expect(category.deletedAt).toBeNull();
        });
    });
});
