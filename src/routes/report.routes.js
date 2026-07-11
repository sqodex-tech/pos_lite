const express = require('express');
const { getProfitLoss, getCashFlow, getAgingReport } = require('../controllers/report.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');
const tenantContext = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(verifyJWT);
router.use(tenantContext);

router.get('/profit-loss', requireModuleAccess('reports', 'view'), getProfitLoss);
router.get('/cash-flow', requireModuleAccess('reports', 'view'), getCashFlow);
router.get('/aging', requireModuleAccess('reports', 'view'), getAgingReport);

module.exports = router;
