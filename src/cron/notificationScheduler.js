const cron = require('node-cron');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const notificationHelper = require('../utils/notificationHelper');

class NotificationScheduler {
    constructor() {
        this.jobs = [];
    }

    // Check for expiring subscriptions (runs daily at 9 AM)
    scheduleExpiringCheck() {
        const job = cron.schedule('0 9 * * *', async () => {
            try {
                logger.info('Running expiring subscriptions check...');
                
                const now = new Date();
                const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

                const expiringSubscriptions = await prisma.subscription.findMany({
                    where: {
                        status: 'active',
                        endDate: {
                            gte: now,
                            lte: sevenDaysFromNow
                        }
                    },
                    include: {
                        tenant: true,
                        plan: true
                    }
                });

                let notificationCount = 0;

                for (const subscription of expiringSubscriptions) {
                    const daysRemaining = Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24));
                    
                    // Only send notifications for 7, 3, and 1 days
                    if (![7, 3, 1].includes(daysRemaining)) continue;

                    let priority = 'medium';
                    let title = '';
                    let message = '';
                    const planName = subscription.plan?.name || 'Your plan';

                    if (daysRemaining === 1) {
                        priority = 'urgent';
                        title = 'Subscription Expiring Tomorrow!';
                        message = `Your ${planName} subscription expires tomorrow. Renew now to avoid service interruption.`;
                    } else if (daysRemaining === 3) {
                        priority = 'high';
                        title = 'Subscription Expiring Soon';
                        message = `Your ${planName} subscription expires in 3 days. Please renew to continue service.`;
                    } else if (daysRemaining === 7) {
                        priority = 'medium';
                        title = 'Subscription Renewal Reminder';
                        message = `Your ${planName} subscription expires in 7 days.`;
                    }

                    const type = subscription.isTrial ? 'trial_ending' : 'subscription_expiring';
                    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

                    // Check if notification already sent today
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            tenantId: subscription.tenantId,
                            metaData: { equals: { subscriptionId: subscription.id } }, // Cannot reliably query inside JSON without raw, but best effort
                            type: type,
                            createdAt: { gte: startOfDay }
                        }
                    });

                    if (!existingNotification) {
                        await notificationHelper.createNotification({
                            tenantId: subscription.tenantId,
                            type: type,
                            priority,
                            title,
                            message,
                            data: {
                                subscriptionId: subscription.id,
                                daysRemaining,
                                planName: planName,
                                endDate: subscription.endDate
                            },
                            actionUrl: `/admin/tenants/${subscription.tenantId}`,
                            actionLabel: 'Renew Now'
                        });

                        notificationCount++;
                    }
                }

                logger.info(`Sent ${notificationCount} expiring subscription notifications`);
            } catch (error) {
                logger.error('Error in expiring subscriptions check:', error);
            }
        });

        this.jobs.push(job);
        logger.info('Scheduled expiring subscriptions check (daily at 9 AM)');
    }

    // Check for expired subscriptions (runs every hour)
    scheduleExpiredCheck() {
        const job = cron.schedule('0 * * * *', async () => {
            try {
                logger.info('Running expired subscriptions check...');
                
                const now = new Date();

                const expiredSubscriptions = await prisma.subscription.findMany({
                    where: {
                        status: 'active',
                        endDate: { lt: now }
                    },
                    include: {
                        tenant: true,
                        plan: true
                    }
                });

                let processedCount = 0;

                for (const subscription of expiredSubscriptions) {
                    // Update subscription status
                    await prisma.subscription.update({
                        where: { id: subscription.id },
                        data: { status: 'expired' }
                    });

                    // Update tenant status
                    await prisma.tenant.update({
                        where: { id: subscription.tenantId },
                        data: { status: 'suspended' }
                    });

                    const planName = subscription.plan?.name || 'Your plan';
                    const type = subscription.isTrial ? 'trial_expired' : 'subscription_expired';

                    // Send notification
                    await notificationHelper.createNotification({
                        tenantId: subscription.tenantId,
                        type: type,
                        priority: 'urgent',
                        title: 'Subscription Expired',
                        message: `Your ${planName} subscription has expired. Please renew to restore access.`,
                        data: {
                            subscriptionId: subscription.id,
                            planName: planName,
                            expiredDate: subscription.endDate
                        },
                        actionUrl: `/admin/tenants/${subscription.tenantId}`,
                        actionLabel: 'Renew Subscription'
                    });

                    processedCount++;
                }

                logger.info(`Processed ${processedCount} expired subscriptions`);
            } catch (error) {
                logger.error('Error in expired subscriptions check:', error);
            }
        });

        this.jobs.push(job);
        logger.info('Scheduled expired subscriptions check (hourly)');
    }

    // Check for payment reminders (runs daily at 10 AM)
    schedulePaymentReminders() {
        const job = cron.schedule('0 10 * * *', async () => {
            try {
                logger.info('Running payment reminders check...');
                
                const now = new Date();
                const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

                const upcomingPayments = await prisma.subscription.findMany({
                    where: {
                        status: 'active',
                        autoRenew: true,
                        nextPaymentDate: {
                            gte: now,
                            lte: threeDaysFromNow
                        },
                        paymentStatus: 'pending'
                    },
                    include: {
                        tenant: true,
                        plan: true
                    }
                });

                let notificationCount = 0;

                for (const subscription of upcomingPayments) {
                    const daysUntilPayment = Math.ceil((subscription.nextPaymentDate - now) / (1000 * 60 * 60 * 24));

                    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                    // Check if notification already sent today
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            tenantId: subscription.tenantId,
                            type: 'payment_due',
                            createdAt: { gte: startOfDay }
                        }
                    });

                    if (!existingNotification) {
                        const planName = subscription.plan?.name || 'Your plan';
                        const amount = subscription.priceSnapshot?.amount || subscription.plan?.price || 0;

                        await notificationHelper.createNotification({
                            tenantId: subscription.tenantId,
                            type: 'payment_due',
                            priority: daysUntilPayment <= 1 ? 'high' : 'medium',
                            title: 'Payment Due Soon',
                            message: `Your payment of $${amount} for ${planName} is due in ${daysUntilPayment} day(s).`,
                            data: {
                                subscriptionId: subscription.id,
                                amount: amount,
                                planName: planName,
                                dueDate: subscription.nextPaymentDate
                            },
                            actionUrl: `/admin/tenants/${subscription.tenantId}`,
                            actionLabel: 'View Details'
                        });

                        notificationCount++;
                    }
                }

                logger.info(`Sent ${notificationCount} payment reminder notifications`);
            } catch (error) {
                logger.error('Error in payment reminders check:', error);
            }
        });

        this.jobs.push(job);
        logger.info('Scheduled payment reminders check (daily at 10 AM)');
    }

    // Initialize all scheduled jobs
    init() {
        logger.info('Initializing notification scheduler...');
        this.scheduleExpiringCheck();
        this.scheduleExpiredCheck();
        this.schedulePaymentReminders();
        logger.info('Notification scheduler initialized successfully');
    }

    // Stop all scheduled jobs
    stop() {
        this.jobs.forEach(job => job.stop());
        logger.info('Notification scheduler stopped');
    }
}

module.exports = new NotificationScheduler();
