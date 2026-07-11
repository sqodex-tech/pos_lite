const { z } = require('zod');

const storeSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(100),
        code: z.string().min(3).max(20),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        managerUserId: z.string().optional(),
        status: z.enum(['active', 'inactive']).optional()
    })
}).passthrough();

const updateStoreSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(100).optional(),
        code: z.string().min(3).max(20).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        managerUserId: z.string().optional(),
        status: z.enum(['active', 'inactive']).optional()
    })
}).passthrough();

module.exports = {
    storeSchema,
    updateStoreSchema
};
