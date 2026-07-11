const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const validate = require('../middleware/validate.middleware');
const { createBrandSchema, updateBrandSchema } = require('../validators/brand.validator');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');
const verifyJWT = require('../middleware/auth.middleware');

router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

router.post('/', requireModuleAccess('inventory', 'create'), validate(createBrandSchema), brandController.createBrand);
router.get('/', requireModuleAccess('inventory', 'view'), brandController.getBrands);
router.get('/:id', requireModuleAccess('inventory', 'view'), brandController.getBrandById);
router.put('/:id', requireModuleAccess('inventory', 'update'), validate(updateBrandSchema), brandController.updateBrand);
router.delete('/:id', requireModuleAccess('inventory', 'delete'), brandController.deleteBrand);

module.exports = router;
