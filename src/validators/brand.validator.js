const { z } = require('zod');

const createBrandSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        description: z.string().optional().or(z.literal('')),
        logo: z.string().url().optional().or(z.literal('')),
        status: z.enum(['active', 'inactive', 'ACTIVE', 'INACTIVE']).optional()
    })
}).passthrough();

const updateBrandSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        description: z.string().optional().or(z.literal('')),
        logo: z.string().url().optional().or(z.literal('')),
        status: z.enum(['active', 'inactive', 'ACTIVE', 'INACTIVE']).optional()
    })
}).passthrough();

module.exports = {
    createBrandSchema,
    updateBrandSchema
};
