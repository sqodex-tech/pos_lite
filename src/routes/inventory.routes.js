const express = require('express');
const {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    getStoreStock,
    getStockMovements,
    adjustStock,
    transferStock,
    getInventoryStats
} = require('../controllers/inventory.controller');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const validate = require('../middleware/validate.middleware');
const { itemSchema, updateItemSchema } = require('../validators/inventory.validator');
const { requireModuleAccess } = require('../middleware/rbac.middleware');
const verifyJWT = require('../middleware/auth.middleware');


const router = express.Router();

router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

// Item management
router.get('/stats', requireModuleAccess('inventory', 'view'), getInventoryStats);
router.get('/', requireModuleAccess('inventory', 'view'), getItems);
router.get('/:id', requireModuleAccess('inventory', 'view'), getItemById);
router.post('/', requireModuleAccess('inventory', 'create'), validate(itemSchema), createItem);
router.patch('/:id', requireModuleAccess('inventory', 'update'), validate(updateItemSchema), updateItem);
router.delete('/:id', requireModuleAccess('inventory', 'delete'), deleteItem);

// Stock management
router.get('/stock/:storeId', requireModuleAccess('inventory', 'view'), getStoreStock);
router.get('/stock/:storeId/:itemId/movements', requireModuleAccess('inventory', 'view'), getStockMovements);
router.post('/stock/:storeId/:itemId/adjust', requireModuleAccess('inventory', 'adjust'), adjustStock);
router.post('/stock/transfer', requireModuleAccess('inventory', 'adjust'), transferStock);

module.exports = router;
