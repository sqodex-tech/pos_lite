const { z } = require('zod');

// ── Plan Schemas ──
const createPlanSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50),
        price: z.number().nonnegative(),
        maxUsers: z.number().int().positive(),
        maxItems: z.number().int().positive(),
        maxBranches: z.number().int().positive(),
        features: z.array(z.string()).optional(),
        durationInDays: z.number().int().positive().optional()
    })
}).passthrough();

const updatePlanSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        price: z.number().nonnegative().optional(),
        maxUsers: z.number().int().positive().optional(),
        maxItems: z.number().int().positive().optional(),
        maxBranches: z.number().int().positive().optional(),
        features: z.array(z.string()).optional(),
        durationInDays: z.number().int().positive().optional()
    })
}).passthrough();

// ── Tenant Schemas ──
const createTenantSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        planId: z.string().min(1, 'Invalid ID').optional().or(z.literal('')),
        // Optional: create an admin user account at the same time
        password: z.string().min(8, 'Password must be at least 8 characters').optional(),
        adminName: z.string().min(2).max(100).optional()
    })
}).passthrough();

const updateTenantSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        planId: z.string().min(1, 'Invalid ID').optional()
    })
}).passthrough();

const updateStatusSchema = z.object({
    body: z.object({
        status: z.enum(['active', 'suspended'])
    })
}).passthrough();

module.exports = {
    createPlanSchema,
    updatePlanSchema,
    createTenantSchema,
    updateTenantSchema,
    updateStatusSchema
};
