const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

// All routes require authentication
router.use(verifyJWT);

// Legacy route
router.get('/', authorize('ADMIN'), permissionController.getAllPermissions);

// ---- New Store-Scoped RBAC Routes ----
router.get('/matrix', authorize('ADMIN', 'SUPER_ADMIN'), permissionController.getStorePermissionMatrix);
router.get('/audit-log', authorize('ADMIN', 'SUPER_ADMIN'), permissionController.getAuditLog);

router.get('/roles/:role', authorize('ADMIN', 'SUPER_ADMIN'), permissionController.getRolePermissions);
router.patch('/roles/:role/modules/:module', authorize('ADMIN', 'SUPER_ADMIN'), permissionController.setModuleActions);
router.post('/roles/:role/modules/:module/grant', authorize('ADMIN', 'SUPER_ADMIN'), permissionController.grantAction);
router.post('/roles/:role/modules/:module/revoke', authorize('ADMIN', 'SUPER_ADMIN'), permissionController.revokeAction);
router.post('/roles/:role/reset', authorize('ADMIN', 'SUPER_ADMIN'), permissionController.resetRoleDefaults);

// ---- Legacy user routes ----
router.get('/user/:userId', authorize('ADMIN'), permissionController.getUserPermissions);
router.patch('/user/:userId', authorize('ADMIN'), permissionController.updateUserPermissions);
router.post('/user/:userId/reset', authorize('ADMIN'), permissionController.resetUserPermissions);
router.post('/bulk-update', authorize('ADMIN'), permissionController.bulkUpdatePermissions);

module.exports = router;
