const { z } = require('zod');

const createCustomerSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().min(5).max(20),
        address: z.string().optional().or(z.literal('')),
        companyName: z.string().optional().or(z.literal('')),
        taxId: z.string().optional().or(z.literal('')),
        creditLimit: z.number().min(0).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'active', 'inactive']).optional()
    })
}).passthrough();

const updateCustomerSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().min(5).max(20).optional(),
        address: z.string().optional().or(z.literal('')),
        companyName: z.string().optional().or(z.literal('')),
        taxId: z.string().optional().or(z.literal('')),
        creditLimit: z.number().min(0).optional(),
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
    createCustomerSchema,
    updateCustomerSchema,
    recordPaymentSchema
};
