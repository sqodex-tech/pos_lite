const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { createTenantSchema, updateTenantSchema, updateStatusSchema, createPlanSchema, updatePlanSchema } = require('../validators/tenant.validator');

// ── Public Plan Routes ──
router.get('/plans', tenantController.getPlans);

// All routes below require authentication
router.use(verifyJWT);

router.get('/profile', authorize('SUPER_ADMIN', 'ADMIN'), tenantController.getProfile);
router.patch('/profile', authorize('SUPER_ADMIN', 'ADMIN'), tenantController.updateProfile);

// All tenant management routes below are restricted to platform admins
router.use(authorize('SUPER_ADMIN'));

// ── Protected Plan CRUD ──
router.post('/plans', validate(createPlanSchema), tenantController.createPlan);
router.patch('/plans/:planId', validate(updatePlanSchema), tenantController.updatePlan);
router.delete('/plans/:planId', tenantController.deletePlan);

// ── Tenant CRUD ──
router.get('/', tenantController.getAllTenants);
router.post('/', validate(createTenantSchema), tenantController.createTenant);
router.get('/:id', tenantController.getTenantById);
router.patch('/:id', validate(updateTenantSchema), tenantController.updateTenant);
router.patch('/:id/status', validate(updateStatusSchema), tenantController.updateTenantStatus);
router.delete('/:id', tenantController.deleteTenant);

// ── Billing CRUD ──
router.get('/:id/billing-history', tenantController.getBillingHistory);
router.post('/:id/billing-history', tenantController.createBillingRecord);
router.patch('/:id/billing-history/:billingId', tenantController.updateBillingRecord);
router.delete('/:id/billing-history/:billingId', tenantController.deleteBillingRecord);

// ── Super Admin Store CRUD (Cross-Tenant) ──
router.get('/stores/all', tenantController.getAllStores);
router.post('/:id/stores', tenantController.createStoreForTenant);
router.patch('/:id/stores/:storeId', tenantController.updateStoreForTenant);
router.delete('/:id/stores/:storeId', tenantController.deleteStoreForTenant);

module.exports = router;
