const { z } = require('zod');

const transactionSchema = z.object({
    body: z.object({
        storeId: z.string(),
        partyId: z.string().optional(),
        partyType: z.enum(['CUSTOMER', 'SUPPLIER', 'OTHER']).optional(),
        customerId: z.string().optional(), // Legacy support
        supplierId: z.string().optional(), // Legacy support
        type: z.enum(['SALE', 'PURCHASE', 'PAYMENT_RECEIVED', 'PAYMENT_MADE', 'RETURN', 'REFUND', 'CASH_IN', 'CASH_OUT']),
        items: z.array(z.object({
            itemId: z.string(),
            itemName: z.string().optional(),
            quantity: z.number().positive(),
            price: z.number().nonnegative(),
            discount: z.number().nonnegative().optional(),
            total: z.number().nonnegative()
        })).optional(),
        subtotal: z.number().nonnegative(),
        discount: z.number().nonnegative().optional(),
        tax: z.number().nonnegative().optional(),
        shipping: z.number().nonnegative().optional(),
        total: z.number().positive(),
        paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CREDIT', 'MIXED']).default('CASH'),
        paymentDetails: z.object({
            cash: z.number().optional(),
            card: z.number().optional(),
            bankTransfer: z.number().optional(),
            credit: z.number().optional()
        }).optional(),
        status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED', 'VOID', 'ON_HOLD']).optional(),
        dueDate: z.string().datetime().optional(),
        notes: z.string().optional()
    })
}).passthrough();

module.exports = {
    transactionSchema
};
