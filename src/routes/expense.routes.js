const express = require('express');
const verifyJWT = require('../middleware/auth.middleware');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');

const { createExpense, getExpenses, getExpenseById, deleteExpense, getExpenseSummary } = require('../controllers/expense.controller');
const validate = require('../middleware/validate.middleware');
const { expenseSchema } = require('../validators/expense.validator');

const router = express.Router();

router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

router.get('/', requireModuleAccess('expenses', 'view'), getExpenses);
router.get('/summary', requireModuleAccess('expenses', 'view'), getExpenseSummary);
router.get('/:id', requireModuleAccess('expenses', 'view'), getExpenseById);
router.post('/', requireModuleAccess('expenses', 'create'), validate(expenseSchema), createExpense);
router.delete('/:id', requireModuleAccess('expenses', 'delete'), deleteExpense);

module.exports = router;
