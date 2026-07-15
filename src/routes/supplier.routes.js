const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const validate = require('../middleware/validate.middleware');
const { createSupplierSchema, updateSupplierSchema, recordPaymentSchema } = require('../validators/supplier.validator');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');
const verifyJWT = require('../middleware/auth.middleware');

router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

// Create Supplier
router.post('/store/:storeId', requireModuleAccess('suppliers', 'create'), validate(createSupplierSchema), supplierController.createSupplier);

// Get Stats
router.get('/stats', requireModuleAccess('suppliers', 'view'), supplierController.getSupplierStats);

// Get all Suppliers
router.get('/', requireModuleAccess('suppliers', 'view'), supplierController.getSuppliers);

// Get single Supplier
router.get('/:id', requireModuleAccess('suppliers', 'view'), supplierController.getSupplierById);

// Update Supplier
router.put('/:id', requireModuleAccess('suppliers', 'update'), validate(updateSupplierSchema), supplierController.updateSupplier);

// Delete Supplier
router.delete('/:id', requireModuleAccess('suppliers', 'delete'), supplierController.deleteSupplier);

// Record Payment to Supplier
router.post('/store/:storeId/:id/payment', requireModuleAccess('suppliers', 'update'), validate(recordPaymentSchema), supplierController.recordPayment);

module.exports = router;
