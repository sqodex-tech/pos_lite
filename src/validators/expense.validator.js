const { z } = require('zod');

const expenseSchema = z.object({
    body: z.object({
        storeId: z.string(),
        category: z.string(),
        amount: z.number().positive(),
        paymentMethod: z.enum(['CASH', 'BANK']).optional().default('CASH'),
        date: z.string().optional(),
        description: z.string().optional(),
        attachmentUrl: z.string().url().optional()
    })
}).passthrough();

module.exports = {
    expenseSchema
};
