const prisma = require('../config/prisma');
const logger = require('./logger');

class NotificationHelper {
    static async createNotification(data) {
        try {
            return await prisma.notification.create({
                data: {
                    tenantId: data.tenantId,
                    userId: data.userId || null,
                    storeId: data.storeId || null,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    priority: data.priority || 'medium',
                    actionUrl: data.actionUrl || null,
                    actionLabel: data.actionLabel || null,
                    isRead: false,
                    isArchived: false,
                    metaData: data.data || null, // data field mapped to metaData
                    expiresAt: data.expiresAt || null,
                }
            });
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Send subscription activated notification
     */
    static async sendSubscriptionActivated(subscription, tenant) {
        try {
            const planName = subscription.plan?.name || 'Your plan';
            await this.createNotification({
                tenantId: tenant.id,
                type: 'SYSTEM',
                priority: 'medium',
                title: 'Subscription Activated',
                message: `Your ${planName} subscription has been activated successfully!`,
                data: {
                    subscriptionId: subscription.id,
                    planName: planName,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'View Details'
            });
            logger.info(`Subscription activated notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending subscription activated notification:', error);
        }
    }

    /**
     * Send subscription cancelled notification
     */
    static async sendSubscriptionCancelled(subscription, tenant, reason, immediate) {
        try {
            const planName = subscription.plan?.name || 'Your plan';
            await this.createNotification({
                tenantId: tenant.id,
                type: 'ALERT',
                priority: immediate ? 'high' : 'medium',
                title: 'Subscription Cancelled',
                message: immediate 
                    ? `Your ${planName} subscription has been cancelled immediately.`
                    : `Your ${planName} subscription will end on ${new Date(subscription.endDate).toLocaleDateString()}.`,
                data: {
                    subscriptionId: subscription.id,
                    planName: planName,
                    reason,
                    immediate,
                    endDate: subscription.endDate
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'View Details'
            });
            logger.info(`Subscription cancelled notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending subscription cancelled notification:', error);
        }
    }

    /**
     * Send subscription renewed notification
     */
    static async sendSubscriptionRenewed(subscription, tenant) {
        try {
            const planName = subscription.plan?.name || 'Your plan';
            await this.createNotification({
                tenantId: tenant.id,
                type: 'SYSTEM',
                priority: 'medium',
                title: 'Subscription Renewed',
                message: `Your ${planName} subscription has been renewed successfully!`,
                data: {
                    subscriptionId: subscription.id,
                    planName: planName,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    amount: subscription.priceSnapshot?.amount
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'View Details'
            });
            logger.info(`Subscription renewed notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending subscription renewed notification:', error);
        }
    }

    /**
     * Send plan changed notification
     */
    static async sendPlanChanged(subscription, tenant, oldPlanName, newPlanName, immediate) {
        try {
            await this.createNotification({
                tenantId: tenant.id,
                type: 'SYSTEM',
                priority: 'medium',
                title: 'Plan Changed',
                message: immediate
                    ? `Your plan has been changed from ${oldPlanName} to ${newPlanName}.`
                    : `Your plan will change from ${oldPlanName} to ${newPlanName} on ${new Date(subscription.endDate).toLocaleDateString()}.`,
                data: {
                    subscriptionId: subscription.id,
                    oldPlan: oldPlanName,
                    newPlan: newPlanName,
                    immediate,
                    effectiveDate: immediate ? new Date() : subscription.endDate
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'View Details'
            });
            logger.info(`Plan changed notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending plan changed notification:', error);
        }
    }

    /**
     * Send payment success notification
     */
    static async sendPaymentSuccess(subscription, tenant, amount) {
        try {
            const planName = subscription.plan?.name || 'Your plan';
            await this.createNotification({
                tenantId: tenant.id,
                type: 'SYSTEM',
                priority: 'low',
                title: 'Payment Successful',
                message: `Your payment of $${amount} for ${planName} has been processed successfully.`,
                data: {
                    subscriptionId: subscription.id,
                    amount,
                    planName: planName,
                    paymentDate: new Date()
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'View Receipt'
            });
            logger.info(`Payment success notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending payment success notification:', error);
        }
    }

    /**
     * Send payment failed notification
     */
    static async sendPaymentFailed(subscription, tenant, amount, reason) {
        try {
            const planName = subscription.plan?.name || 'Your plan';
            await this.createNotification({
                tenantId: tenant.id,
                type: 'ALERT',
                priority: 'high',
                title: 'Payment Failed',
                message: `Your payment of $${amount} for ${planName} has failed. Please update your payment method.`,
                data: {
                    subscriptionId: subscription.id,
                    amount,
                    planName: planName,
                    reason,
                    failedDate: new Date()
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'Update Payment'
            });
            logger.info(`Payment failed notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending payment failed notification:', error);
        }
    }

    /**
     * Send limit reached notification
     */
    static async sendLimitReached(tenant, limitType, currentValue, maxValue) {
        try {
            await this.createNotification({
                tenantId: tenant.id,
                type: 'WARNING',
                priority: 'high',
                title: 'Subscription Limit Reached',
                message: `You have reached your ${limitType} limit (${currentValue}/${maxValue}). Please upgrade your plan to continue.`,
                data: {
                    limitType,
                    currentValue,
                    maxValue
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'Upgrade Plan'
            });
            logger.info(`Limit reached notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending limit reached notification:', error);
        }
    }

    /**
     * Send limit warning notification (80% of limit)
     */
    static async sendLimitWarning(tenant, limitType, currentValue, maxValue) {
        try {
            const percentage = Math.round((currentValue / maxValue) * 100);
            
            await this.createNotification({
                tenantId: tenant.id,
                type: 'WARNING',
                priority: 'medium',
                title: 'Approaching Subscription Limit',
                message: `You are at ${percentage}% of your ${limitType} limit (${currentValue}/${maxValue}). Consider upgrading your plan.`,
                data: {
                    limitType,
                    currentValue,
                    maxValue,
                    percentage
                },
                actionUrl: `/admin/tenants/${tenant.id}`,
                actionLabel: 'View Plans'
            });
            logger.info(`Limit warning notification sent to tenant ${tenant.id}`);
        } catch (error) {
            logger.error('Error sending limit warning notification:', error);
        }
    }
}

module.exports = NotificationHelper;
