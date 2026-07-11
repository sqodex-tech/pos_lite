const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES', 'ACCOUNTANT']).optional(),
        tenantId: z.string().min(1, 'Invalid ID').optional()
    })
}).passthrough();

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required')
    })
}).passthrough();

// ── Tenant Self-Registration Schema ──
const registerTenantSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        phone: z.string().optional(),
        address: z.string().optional()
    })
}).passthrough();

module.exports = {
    registerSchema,
    loginSchema,
    registerTenantSchema
};
