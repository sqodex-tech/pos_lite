const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

// All routes require authentication
router.use(verifyJWT);

// Get notifications
router.get(
    '/',
    authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER'),
    notificationController.getNotifications
);

// Get unread count
router.get(
    '/unread-count',
    authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER'),
    notificationController.getUnreadCount
);

// Mark as read
router.patch(
    '/:id/read',
    authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER'),
    notificationController.markAsRead
);

// Mark all as read
router.patch(
    '/read-all',
    authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER'),
    notificationController.markAllAsRead
);

// Archive notification
router.patch(
    '/:id/archive',
    authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER'),
    notificationController.archiveNotification
);

// Delete notification
router.delete(
    '/:id',
    authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER'),
    notificationController.deleteNotification
);

// Send test notification (ADMIN only)
router.post(
    '/test',
    authorize('SUPER_ADMIN', 'ADMIN'),
    notificationController.sendTestNotification
);

// Check expiring subscriptions (ADMIN only or CRON)
router.post(
    '/check-expiring',
    authorize('SUPER_ADMIN', 'ADMIN'),
    notificationController.checkExpiringSubscriptions
);

// Check expired subscriptions (ADMIN only or CRON)
router.post(
    '/check-expired',
    authorize('SUPER_ADMIN', 'ADMIN'),
    notificationController.checkExpiredSubscriptions
);

module.exports = router;
