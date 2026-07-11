const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const {
    createUnitSchema,
    updateUnitSchema,
    convertUnitSchema,
    querySchema
} = require('../validators/unit.validator');

// All routes require authentication, tenant isolation, and store access validation
router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

/**
 * @route   POST /api/v1/units
 * @desc    Create a new unit
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.post(
    '/',
    requireModuleAccess('units', 'create'),
    validate(createUnitSchema),
    unitController.createUnit
);

/**
 * @route   GET /api/v1/units
 * @desc    Get all units with pagination
 * @access  Private (All authenticated users)
 * @param   {string} storeId - Required in query parameter
 */
router.get(
    '/',
    requireModuleAccess('units', 'view'),
    validate(querySchema),
    unitController.getUnits
);

/**
 * @route   GET /api/v1/units/by-category
 * @desc    Get units grouped by category
 * @access  Private (All authenticated users)
 * @param   {string} storeId - Required in query parameter
 */
router.get(
    '/by-category',
    requireModuleAccess('units', 'view'),
    unitController.getUnitsByCategory
);

/**
 * @route   POST /api/v1/units/convert
 * @desc    Convert value between units
 * @access  Private (All authenticated users)
 * @param   {string} storeId - Required in query, body, or params
 */
router.post(
    '/convert',
    requireModuleAccess('units', 'view'),
    validate(convertUnitSchema),
    unitController.convertUnits
);

/**
 * @route   GET /api/v1/units/:id
 * @desc    Get unit by ID
 * @access  Private (All authenticated users)
 * @param   {string} storeId - Required in query parameter
 */
router.get(
    '/:id',
    requireModuleAccess('units', 'view'),
    unitController.getUnitById
);

/**
 * @route   PATCH /api/v1/units/:id
 * @desc    Update unit
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.patch(
    '/:id',
    requireModuleAccess('units', 'update'),
    validate(updateUnitSchema),
    unitController.updateUnit
);

/**
 * @route   DELETE /api/v1/units/:id
 * @desc    Delete unit (soft delete)
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.delete(
    '/:id',
    requireModuleAccess('units', 'delete'),
    unitController.deleteUnit
);

/**
 * @route   POST /api/v1/units/:id/restore
 * @desc    Restore deleted unit
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.post(
    '/:id/restore',
    requireModuleAccess('units', 'update'),
    unitController.restoreUnit
);

module.exports = router;
