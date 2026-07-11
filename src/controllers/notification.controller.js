const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * @desc Get notifications for tenant
 * @route GET /api/v1/notifications
 * @access ADMIN
 */
exports.getNotifications = async (req, res, next) => {
    try {
        if (req.user.role === 'SUPER_ADMIN') {
            return res.status(200).json(new ApiResponse(200, [], 'Notifications retrieved', {
                pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
            }));
        }

        const { page = 1, limit = 20, status, type, priority } = req.query;

        // Build query
        const where = {
            tenantId: req.user.tenantId
        };

        if (status) where.status = status;
        if (type) where.type = type;
        if (priority) where.priority = priority;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);

        const notifications = await prisma.notification.findMany({
            where,
            include: {
                tenant: { select: { name: true, email: true } },
                subscription: { select: { planId: true, status: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: (pageNum - 1) * limitNum
        });

        const total = await prisma.notification.count({ where });

        res.status(200).json(new ApiResponse(200, notifications, 'Notifications retrieved', {
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get unread notification count
 * @route GET /api/v1/notifications/unread-count
 * @access ADMIN
 */
exports.getUnreadCount = async (req, res, next) => {
    try {
        if (req.user.role === 'SUPER_ADMIN') {
            return res.status(200).json(new ApiResponse(200, { count: 0 }, 'Unread count retrieved'));
        }

        const where = {
            status: 'unread',
            tenantId: req.user.tenantId
        };

        const count = await prisma.notification.count({ where });

        res.status(200).json(new ApiResponse(200, { count }, 'Unread count retrieved'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Mark notification as read
 * @route PATCH /api/v1/notifications/:id/read
 * @access ADMIN
 */
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id }
        });

        if (!notification) {
            throw new ApiError(404, 'Notification not found');
        }

        // Check access
        if (notification.tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        const updated = await prisma.notification.update({
            where: { id: req.params.id },
            data: { status: 'read', readAt: new Date() }
        });

        res.status(200).json(new ApiResponse(200, updated, 'Notification marked as read'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Mark all notifications as read
 * @route PATCH /api/v1/notifications/read-all
 * @access ADMIN
 */
exports.markAllAsRead = async (req, res, next) => {
    try {
        if (req.user.role === 'SUPER_ADMIN') {
            return res.status(200).json(new ApiResponse(200, { modifiedCount: 0 }, 'All notifications marked as read'));
        }

        const where = {
            status: 'unread',
            tenantId: req.user.tenantId
        };

        const result = await prisma.notification.updateMany({
            where,
            data: {
                status: 'read',
                readAt: new Date()
            }
        });

        res.status(200).json(new ApiResponse(200, {
            modifiedCount: result.count
        }, 'All notifications marked as read'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Archive notification
 * @route PATCH /api/v1/notifications/:id/archive
 * @access ADMIN
 */
exports.archiveNotification = async (req, res, next) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id }
        });

        if (!notification) {
            throw new ApiError(404, 'Notification not found');
        }

        // Check access
        if (notification.tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        const updated = await prisma.notification.update({
            where: { id: req.params.id },
            data: { status: 'archived' }
        });

        res.status(200).json(new ApiResponse(200, updated, 'Notification archived'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Delete notification
 * @route DELETE /api/v1/notifications/:id
 * @access ADMIN
 */
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id }
        });

        if (!notification) {
            throw new ApiError(404, 'Notification not found');
        }

        // Check access
        if (notification.tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        await prisma.notification.delete({
            where: { id: req.params.id }
        });

        res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Send test notification
 * @route POST /api/v1/notifications/test
 * @access ADMIN (Internal/System Use)
 */
exports.sendTestNotification = async (req, res, next) => {
    try {
        const { tenantId, type, title, message } = req.body;

        // Ensure user can only send to their own tenant
        if (req.user.role === 'ADMIN' && tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        const notification = await prisma.notification.create({
            data: {
                tenantId: tenantId || req.user.tenantId,
                type: type || 'payment_success',
                priority: 'medium',
                title: title || 'Test Notification',
                message: message || 'This is a test notification',
                channels: ['in_app'],
                actionUrl: '/store',
                actionLabel: 'View Details'
            }
        });

        res.status(201).json(new ApiResponse(201, notification, 'Test notification sent'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Check and send expiring subscription notifications
 * @route POST /api/v1/notifications/check-expiring
 * @access System/CRON job
 */
exports.checkExpiringSubscriptions = async (req, res, next) => {
    try {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Find subscriptions expiring soon
        const expiringSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'active',
                endDate: {
                    gte: now,
                    lte: sevenDaysFromNow
                }
            },
            include: { tenant: true, plan: true }
        });

        const notifications = [];

        for (const subscription of expiringSubscriptions) {
            const daysRemaining = Math.ceil((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24));

            let priority = 'medium';
            let title = '';
            let message = '';

            if (daysRemaining <= 1) {
                priority = 'urgent';
                title = 'Subscription Expiring Tomorrow!';
                message = `Your ${subscription.plan.name} subscription expires tomorrow. Renew now to avoid service interruption.`;
            } else if (daysRemaining <= 3) {
                priority = 'high';
                title = 'Subscription Expiring Soon';
                message = `Your ${subscription.plan.name} subscription expires in ${daysRemaining} days. Please renew to continue service.`;
            } else if (daysRemaining <= 7) {
                priority = 'medium';
                title = 'Subscription Renewal Reminder';
                message = `Your ${subscription.plan.name} subscription expires in ${daysRemaining} days.`;
            }

            // Check if notification already sent today
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    tenantId: subscription.tenant.id,
                    subscriptionId: subscription.id,
                    type: subscription.isTrial ? 'trial_ending' : 'subscription_expiring',
                    createdAt: { gte: startOfDay }
                }
            });

            if (!existingNotification) {
                const notification = await prisma.notification.create({
                    data: {
                        tenantId: subscription.tenant.id,
                        subscriptionId: subscription.id,
                        type: subscription.isTrial ? 'trial_ending' : 'subscription_expiring',
                        priority,
                        title,
                        message,
                        data: {
                            daysRemaining,
                            planName: subscription.plan.name,
                            endDate: subscription.endDate
                        },
                        channels: ['in_app', 'email'],
                        actionUrl: '/store/billing',
                        actionLabel: 'Renew Now'
                    }
                });

                notifications.push(notification);
            }
        }

        logger.info(`Sent ${notifications.length} expiring subscription notifications`);
        res.status(200).json(new ApiResponse(200, {
            count: notifications.length,
            notifications
        }, 'Expiring subscription notifications sent'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Check and send expired subscription notifications
 * @route POST /api/v1/notifications/check-expired
 * @access System/CRON job
 */
exports.checkExpiredSubscriptions = async (req, res, next) => {
    try {
        const now = new Date();

        // Find subscriptions that expired today
        const expiredSubscriptions = await prisma.subscription.findMany({
            where: {
                status: 'active',
                endDate: { lt: now }
            },
            include: { tenant: true, plan: true }
        });

        const notifications = [];

        for (const subscription of expiredSubscriptions) {
            // Update subscription status
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'expired' }
            });

            // Update tenant status
            await prisma.tenant.update({
                where: { id: subscription.tenant.id },
                data: { status: 'suspended' }
            });

            // Send notification
            const notification = await prisma.notification.create({
                data: {
                    tenantId: subscription.tenant.id,
                    subscriptionId: subscription.id,
                    type: subscription.isTrial ? 'trial_expired' : 'subscription_expired',
                    priority: 'urgent',
                    title: 'Subscription Expired',
                    message: `Your ${subscription.plan.name} subscription has expired. Please renew to restore access.`,
                    data: {
                        planName: subscription.plan.name,
                        expiredDate: subscription.endDate
                    },
                    channels: ['in_app', 'email'],
                    actionUrl: '/store/billing',
                    actionLabel: 'Renew Subscription'
                }
            });

            notifications.push(notification);
        }

        logger.info(`Processed ${expiredSubscriptions.length} expired subscriptions`);
        res.status(200).json(new ApiResponse(200, {
            count: notifications.length,
            notifications
        }, 'Expired subscription notifications sent'));
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
