const { z } = require('zod');

const createSupplierSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        contactPerson: z.string().optional().or(z.literal('')),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().min(5).max(20),
        address: z.string().optional().or(z.literal('')),
        companyName: z.string().min(2).max(100).optional().or(z.literal('')),
        taxId: z.string().optional().or(z.literal('')),
        paymentTermsDays: z.number().int().min(0).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'active', 'inactive']).optional()
    })
}).passthrough();

const updateSupplierSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        contactPerson: z.string().optional().or(z.literal('')),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().min(5).max(20).optional(),
        address: z.string().optional().or(z.literal('')),
        companyName: z.string().min(2).max(100).optional(),
        taxId: z.string().optional().or(z.literal('')),
        paymentTermsDays: z.number().int().min(0).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'active', 'inactive']).optional()
    })
}).passthrough();

const recordPaymentSchema = z.object({
    body: z.object({
        amount: z.number().positive(),
        paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
        description: z.string().optional()
    })
}).passthrough();

module.exports = {
    createSupplierSchema,
    updateSupplierSchema,
    recordPaymentSchema
};
