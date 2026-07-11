const express = require('express');
const { createStore, getStores, getStoreById, updateStore, deleteStore, getStoreStats } = require('../controllers/store.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize, requireModuleAccess } = require('../middleware/rbac.middleware');
const tenantContext = require('../middleware/tenant.middleware');
const { strictLimiter } = require('../middleware/rateLimiter.middleware');

const validate = require('../middleware/validate.middleware');
const { storeSchema, updateStoreSchema } = require('../validators/store.validator');

const router = express.Router();

// All store routes require authentication and tenant context
router.use(verifyJWT);
router.use(tenantContext);

router.get('/', requireModuleAccess('stores', 'view'), getStores);
router.get('/:id', requireModuleAccess('stores', 'view'), getStoreById);
router.get('/:id/stats', requireModuleAccess('stores', 'view'), getStoreStats);
router.post('/', strictLimiter, requireModuleAccess('stores', 'create'), validate(storeSchema), createStore);
router.patch('/:id', requireModuleAccess('stores', 'update'), validate(updateStoreSchema), updateStore);
router.delete('/:id', requireModuleAccess('stores', 'delete'), deleteStore);

module.exports = router;
