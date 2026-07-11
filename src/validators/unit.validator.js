const { z } = require('zod');

const createUnitSchema = z.object({
    body: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional(), // Optional in body since it can come from query/params
        name: z.string()
            .min(1, 'Name is required')
            .max(50, 'Name must not exceed 50 characters')
            .trim(),
        symbol: z.string()
            .min(1, 'Symbol is required')
            .max(10, 'Symbol must not exceed 10 characters')
            .trim(),
        description: z.string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional(),
        category: z.enum(['weight', 'count', 'volume', 'length', 'area', 'time'], {
            errorMap: () => ({ message: 'Invalid unit category' })
        }),
        baseUnit: z.string()
            .min(1, 'Invalid ID')
            .optional()
            .nullable(),
        conversionFactor: z.number()
            .positive('Conversion factor must be positive')
            .optional(),
        precision: z.number()
            .int()
            .min(0)
            .max(6)
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

const updateUnitSchema = z.object({
    body: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional(), // Optional in body since it can come from query/params
        name: z.string()
            .min(1, 'Name is required')
            .max(50, 'Name must not exceed 50 characters')
            .trim()
            .optional(),
        symbol: z.string()
            .min(1, 'Symbol is required')
            .max(10, 'Symbol must not exceed 10 characters')
            .trim()
            .optional(),
        description: z.string()
            .max(500, 'Description must not exceed 500 characters')
            .trim()
            .optional(),
        category: z.enum(['weight', 'count', 'volume', 'length', 'area', 'time'])
            .optional(),
        baseUnit: z.string()
            .min(1, 'Invalid ID')
            .optional()
            .nullable(),
        conversionFactor: z.number()
            .positive('Conversion factor must be positive')
            .optional(),
        precision: z.number()
            .int()
            .min(0)
            .max(6)
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

const convertUnitSchema = z.object({
    body: z.object({
        storeId: z.string()
            .min(1, 'Invalid ID')
            .optional(), // Optional in body since it can come from query/params
        value: z.number()
            .positive('Value must be positive'),
        fromUnitId: z.string()
            .min(1, 'Invalid ID'),
        toUnitId: z.string()
            .min(1, 'Invalid ID')
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
        category: z.enum(['weight', 'count', 'volume', 'length', 'area', 'time', 'all']).optional(),
        status: z.enum(['active', 'inactive', 'all']).optional(),
        includeDeleted: z.enum(['true', 'false']).optional()
    })
}).passthrough();

module.exports = {
    createUnitSchema,
    updateUnitSchema,
    convertUnitSchema,
    querySchema
};
