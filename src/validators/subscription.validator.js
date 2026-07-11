const { z } = require('zod');

const activateSubscriptionSchema = z.object({
    params: z.object({
        tenantId: z.string().min(1, 'Tenant ID is required')
    }),
    body: z.object({
        planId: z.string().min(1, 'Plan ID is required'),
        autoRenew: z.boolean().optional().default(true),
        isTrial: z.boolean().optional().default(false)
    })
}).passthrough();

const changePlanSchema = z.object({
    params: z.object({
        subscriptionId: z.string().min(1, 'Subscription ID is required')
    }),
    body: z.object({
        newPlanId: z.string().min(1, 'Plan ID is required'),
        immediate: z.boolean().optional().default(false)
    })
}).passthrough();

const cancelSubscriptionSchema = z.object({
    params: z.object({
        subscriptionId: z.string().min(1, 'Subscription ID is required')
    }),
    body: z.object({
        reason: z.string().optional(),
        immediate: z.boolean().optional().default(false)
    })
}).passthrough();

module.exports = {
    activateSubscriptionSchema,
    changePlanSchema,
    cancelSubscriptionSchema
};
