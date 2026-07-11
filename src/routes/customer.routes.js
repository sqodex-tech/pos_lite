const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const validate = require('../middleware/validate.middleware');
const { createCustomerSchema, updateCustomerSchema, recordPaymentSchema } = require('../validators/customer.validator');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');
const verifyJWT = require('../middleware/auth.middleware');

router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

// Create Customer
router.post('/store/:storeId', requireModuleAccess('customers', 'create'), validate(createCustomerSchema), customerController.createCustomer);

// Get all Customers
router.get('/', requireModuleAccess('customers', 'view'), customerController.getCustomers);

// Get single Customer
router.get('/:id', requireModuleAccess('customers', 'view'), customerController.getCustomerById);

// Update Customer
router.put('/:id', requireModuleAccess('customers', 'update'), validate(updateCustomerSchema), customerController.updateCustomer);

// Delete Customer
router.delete('/:id', requireModuleAccess('customers', 'delete'), customerController.deleteCustomer);

// Record Payment from Customer
router.post('/store/:storeId/:id/payment', requireModuleAccess('customers', 'update'), validate(recordPaymentSchema), customerController.recordPayment);

module.exports = router;
