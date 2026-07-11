const prisma = require('../config/prisma');
const logger = require('../utils/logger');

class BillingService {
    /**
     * Process recurring billing for all active subscriptions
     * This should be called by a cron job daily
     */
    static async processRecurringBilling() {
        try {
            logger.info('Starting recurring billing process...');

            const now = new Date();

            // Find all active subscriptions where next payment is due
            const subscriptionsToBill = await prisma.subscription.findMany({
                where: {
                    status: 'active',
                    nextPaymentDate: { lte: now }
                },
                include: {
                    tenant: true,
                    plan: true
                }
            });

            let processedCount = 0;
            let successCount = 0;
            let failedCount = 0;

            for (const subscription of subscriptionsToBill) {
                try {
                    const result = await this.processSubscriptionBilling(subscription);
                    if (result.success) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                    processedCount++;
                } catch (error) {
                    logger.error(`Error processing billing for subscription ${subscription.id}:`, error);
                    failedCount++;
                }
            }

            logger.info(`Recurring billing completed. Processed: ${processedCount}, Success: ${successCount}, Failed: ${failedCount}`);
            return { processedCount, successCount, failedCount };
        } catch (error) {
            logger.error('Error in recurring billing process:', error);
            throw error;
        }
    }

    /**
     * Process billing for a specific subscription
     */
    static async processSubscriptionBilling(subscription) {
        try {
            const tenant = subscription.tenant;
            const plan = subscription.plan;

            if (!tenant || !plan) {
                logger.warn(`Subscription ${subscription.id} missing tenant or plan`);
                return { success: false, reason: 'Missing context' };
            }

            // Create pending billing history record
            const billingHistory = await prisma.billingHistory.create({
                data: {
                    tenantId: tenant.id,
                    subscriptionId: subscription.id,
                    amount: subscription.priceSnapshot?.amount || plan.price,
                    currency: subscription.priceSnapshot?.currency || 'USD',
                    status: 'pending',
                    description: `Recurring payment for ${plan.name} plan`
                }
            });

            // Attempt payment processing (simulate payment gateway)
            const paymentResult = await this.processPayment(tenant, subscription);

            if (paymentResult.success) {
                // Update Billing History
                await prisma.billingHistory.update({
                    where: { id: billingHistory.id },
                    data: {
                        status: 'paid',
                        paymentMethod: paymentResult.paymentMethod,
                        paymentDetails: {
                            transactionId: paymentResult.transactionId,
                            paymentGateway: paymentResult.paymentGateway || 'default',
                            paidAt: paymentResult.paidAt
                        }
                    }
                });

                // Calculate next payment date
                const nextPaymentDate = subscription.nextPaymentDate ? new Date(subscription.nextPaymentDate) : new Date();
                nextPaymentDate.setDate(nextPaymentDate.getDate() + (subscription.priceSnapshot?.durationInDays || 30));

                let updateData = {
                    lastPaymentDate: paymentResult.paidAt,
                    paymentStatus: 'paid',
                    nextPaymentDate
                };

                // Also update endDate if it's lagging (ensures subscription stays active)
                if (!subscription.endDate || new Date(subscription.endDate) < nextPaymentDate) {
                    updateData.endDate = nextPaymentDate;
                }

                // If there's a scheduled plan change, apply it now
                if (subscription.scheduledPlanId) {
                    const newPlan = await prisma.plan.findUnique({ where: { id: subscription.scheduledPlanId }});
                    if (newPlan) {
                        updateData.planId = newPlan.id;
                        updateData.priceSnapshot = {
                            amount: newPlan.price,
                            currency: 'USD',
                            durationInDays: newPlan.durationInDays || 30
                        };
                        updateData.limitsSnapshot = {
                            maxUsers: newPlan.maxUsers,
                            maxItems: newPlan.maxItems,
                            maxBranches: newPlan.maxBranches
                        };
                        updateData.scheduledPlanId = null; // Clear the schedule
                        updateData.notes = `Plan automatically changed to ${newPlan.name}`;

                        // Update Tenant's current plan
                        await prisma.tenant.update({
                            where: { id: tenant.id },
                            data: { subscriptionPlan: newPlan.id }
                        });
                    }
                }

                // Update Subscription
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: updateData
                });

                // Update Tenant next billing date for sync
                await prisma.tenant.update({
                    where: { id: tenant.id },
                    data: { nextBillingDate: nextPaymentDate }
                });

                logger.info(`Payment successful for subscription ${subscription.id}`);
                return { success: true };
            } else {
                // Handle failed payment
                await prisma.billingHistory.update({
                    where: { id: billingHistory.id },
                    data: { status: 'failed' }
                });

                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { paymentStatus: 'failed' }
                });

                logger.warn(`Payment failed for subscription ${subscription.id}: ${paymentResult.reason}`);
                return { success: false, reason: paymentResult.reason };
            }
        } catch (error) {
            logger.error(`Error processing subscription billing for ${subscription.id}:`, error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Simulate payment processing
     */
    static async processPayment(tenant, subscription) {
        try {
            // Simulate 90% success rate
            const success = Math.random() > 0.1;

            if (success) {
                return {
                    success: true,
                    transactionId: `txn_${Date.now()}_${subscription.id}`,
                    paymentMethod: 'card',
                    paymentGateway: 'stripe',
                    paidAt: new Date()
                };
            } else {
                return {
                    success: false,
                    reason: 'Insufficient funds',
                    failureCode: 'insufficient_funds'
                };
            }
        } catch (error) {
            return {
                success: false,
                reason: error.message,
                failureCode: 'processing_error'
            };
        }
    }

    /**
     * Get billing statistics using Subscriptions and History
     */
    static async getBillingStats() {
        try {
            const revenueStats = await prisma.billingHistory.aggregate({
                where: { status: 'paid' },
                _sum: { amount: true },
                _count: { id: true }
            });

            const subscriptionStatsRaw = await prisma.subscription.groupBy({
                by: ['status'],
                _count: { id: true }
            });
            
            const subscriptionStats = subscriptionStatsRaw.map(s => ({
                _id: s.status,
                count: s._count.id
            }));

            return {
                totalRevenue: revenueStats._sum.amount || 0,
                totalPayments: revenueStats._count.id || 0,
                subscriptionBreakdown: subscriptionStats
            };
        } catch (error) {
            logger.error('Error getting billing stats:', error);
            throw error;
        }
    }
}

module.exports = BillingService;