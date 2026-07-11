const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { activateSubscriptionSchema, changePlanSchema, cancelSubscriptionSchema } = require('../validators/subscription.validator');

// All routes require authentication
router.use(verifyJWT);

router.post(
    '/tenant/:tenantId/activate',
    authorize('SUPER_ADMIN', 'ADMIN'),
    validate(activateSubscriptionSchema),
    subscriptionController.activateSubscription
);

router.get(
    '/me/summary',
    authorize('SUPER_ADMIN', 'ADMIN'),
    subscriptionController.getMySubscriptionSummary
);

router.get(
    '/tenant/:tenantId/active',
    authorize('SUPER_ADMIN', 'ADMIN'),
    subscriptionController.getActiveSubscription
);

router.get(
    '/tenant/:tenantId/history',
    authorize('SUPER_ADMIN', 'ADMIN'),
    subscriptionController.getSubscriptionHistory
);

router.post(
    '/:subscriptionId/change-plan',
    authorize('SUPER_ADMIN', 'ADMIN'),
    validate(changePlanSchema),
    subscriptionController.changePlan
);

router.post(
    '/:subscriptionId/cancel',
    authorize('SUPER_ADMIN', 'ADMIN'),
    validate(cancelSubscriptionSchema),
    subscriptionController.cancelSubscription
);

router.post(
    '/:subscriptionId/renew',
    authorize('SUPER_ADMIN', 'ADMIN'),
    subscriptionController.renewSubscription
);

router.post(
    '/:subscriptionId/approve',
    authorize('SUPER_ADMIN'),
    subscriptionController.approveSubscription
);

router.get(
    '/',
    authorize('SUPER_ADMIN', 'ADMIN'),
    subscriptionController.getAllSubscriptions
);

router.get(
    '/stats',
    authorize('SUPER_ADMIN', 'ADMIN'),
    subscriptionController.getSubscriptionStats
);

module.exports = router;
