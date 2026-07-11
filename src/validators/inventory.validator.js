const { z } = require('zod');

const itemSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        barcode: z.string().optional(),
        categoryId: z.string(),
        brandId: z.string().optional(),
        unitId: z.string(),
        purchasePrice: z.number().min(0),
        salePrice: z.number().min(0),
        lowStockAlert: z.number().optional(),
        status: z.enum(['active', 'inactive']).optional(),
        storeId: z.string().optional(),
        initialStock: z.number().min(0).optional(),
        addStock: z.number().min(0).optional(),
        expiryDate: z.string().nullable().optional()
    })
}).passthrough();

const updateItemSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        barcode: z.string().optional(),
        categoryId: z.string().optional(),
        brandId: z.string().optional(),
        unitId: z.string().optional(),
        purchasePrice: z.number().min(0).optional(),
        salePrice: z.number().min(0).optional(),
        lowStockAlert: z.number().optional(),
        status: z.enum(['active', 'inactive']).optional(),
        storeId: z.string().optional(),
        initialStock: z.number().min(0).optional(),
        addStock: z.number().min(0).optional(),
        expiryDate: z.string().nullable().optional()
    })
}).passthrough();

module.exports = {
    itemSchema,
    updateItemSchema
};
