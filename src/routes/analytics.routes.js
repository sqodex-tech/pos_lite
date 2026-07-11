const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

// All routes require authentication and ADMIN role
router.use(verifyJWT);
router.use(authorize('SUPER_ADMIN', 'ADMIN'));

// Dashboard analytics
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Subscription analytics
router.get('/subscriptions', analyticsController.getSubscriptionAnalytics);

// Revenue analytics
router.get('/revenue', analyticsController.getRevenueAnalytics);

// Tenant analytics
router.get('/tenants', analyticsController.getTenantAnalytics);

// Cohort analysis
router.get('/cohorts', analyticsController.getCohortAnalysis);

module.exports = router;
