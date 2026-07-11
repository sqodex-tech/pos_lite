const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');

describe('Auth Endpoints', () => {
    it('should fail registration without tenantId', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error.message).toBe('Validation Error');
    });
});
