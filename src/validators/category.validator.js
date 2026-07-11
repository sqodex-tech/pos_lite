const { z } = require('zod');

const createCategorySchema = z.object({
    body: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional(), // Optional in body since it can come from query/params
        name: z.string()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim(),
        description: z.string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional(),
        parentId: z.string()
            .min(1, 'Invalid ID')
            .optional()
            .nullable(),
        icon: z.string()
            .max(50, 'Icon must not exceed 50 characters')
            .trim()
            .optional(),
        color: z.string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
            .optional(),
        sortOrder: z.number()
            .int()
            .min(0)
            .optional(),
        status: z.enum(['active', 'inactive'])
            .optional()
    }),
    query: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional()
    }).optional()
}).passthrough();

const updateCategorySchema = z.object({
    body: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional(), // Optional in body since it can come from query/params
        name: z.string()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name must not exceed 100 characters')
            .trim()
            .optional(),
        description: z.string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional(),
        parentId: z.string()
            .min(1, 'Invalid ID')
            .optional()
            .nullable(),
        icon: z.string()
            .max(50, 'Icon must not exceed 50 characters')
            .trim()
            .optional(),
        color: z.string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
            .optional(),
        sortOrder: z.number()
            .int()
            .min(0)
            .optional(),
        status: z.enum(['active', 'inactive'])
            .optional()
    }),
    query: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional()
    }).optional()
}).passthrough();

const querySchema = z.object({
    query: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional(), // Optional since validateStoreAccess middleware will handle requirement
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        search: z.string().optional(),
        status: z.enum(['active', 'inactive', 'all']).optional(),
        parentId: z.string().min(1, 'Invalid ID').optional().nullable(),
        includeDeleted: z.enum(['true', 'false']).optional()
    })
}).passthrough();

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    querySchema
};
