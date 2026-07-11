const express = require('express');
const verifyJWT = require('../middleware/auth.middleware');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');

const { 
    createTransaction, 
    getTransactions, 
    getTransactionById, 
    deleteTransaction,
    getPartyStatement,
    getDashboardSummary
} = require('../controllers/transaction.controller');
const validate = require('../middleware/validate.middleware');
const { transactionSchema } = require('../validators/transaction.validator');

const router = express.Router();

router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

router.get('/', requireModuleAccess('transactions', 'view'), getTransactions);
router.get('/dashboard-summary', requireModuleAccess('transactions', 'view'), getDashboardSummary);
router.get('/statement/:partyId', requireModuleAccess('transactions', 'view'), getPartyStatement);
router.get('/store/:storeId', requireModuleAccess('transactions', 'view'), getTransactions);
router.get('/:id', requireModuleAccess('transactions', 'view'), getTransactionById);
router.post('/', requireModuleAccess('transactions', 'create'), validate(transactionSchema), createTransaction);
router.delete('/:id', requireModuleAccess('transactions', 'delete'), deleteTransaction);

module.exports = router;
