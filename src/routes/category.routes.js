const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { tenantIsolation, validateStoreAccess } = require('../middleware/tenantIsolation.middleware');
const { requireModuleAccess } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const {
    createCategorySchema,
    updateCategorySchema,
    querySchema
} = require('../validators/category.validator');

// All routes require authentication, tenant isolation, and store access validation
router.use(verifyJWT);
router.use(tenantIsolation);
router.use(validateStoreAccess);

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.post(
    '/',
    requireModuleAccess('category', 'create'),
    validate(createCategorySchema),
    categoryController.createCategory
);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories with pagination
 * @access  Private (All authenticated users)
 * @param   {string} storeId - Required in query parameter
 */
router.get(
    '/',
    requireModuleAccess('category', 'view'),
    validate(querySchema),
    categoryController.getCategories
);

/**
 * @route   GET /api/v1/categories/tree
 * @desc    Get category tree (hierarchical structure)
 * @access  Private (All authenticated users)
 * @param   {string} storeId - Required in query parameter
 */
router.get(
    '/tree',
    requireModuleAccess('category', 'view'),
    categoryController.getCategoryTree
);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Private (All authenticated users)
 * @param   {string} storeId - Required in query parameter
 */
router.get(
    '/:id',
    requireModuleAccess('category', 'view'),
    categoryController.getCategoryById
);

/**
 * @route   PATCH /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.patch(
    '/:id',
    requireModuleAccess('category', 'update'),
    validate(updateCategorySchema),
    categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.delete(
    '/:id',
    requireModuleAccess('category', 'delete'),
    categoryController.deleteCategory
);

/**
 * @route   POST /api/v1/categories/:id/restore
 * @desc    Restore deleted category
 * @access  Private (ADMIN, STORE_MANAGER)
 * @param   {string} storeId - Required in query, body, or params
 */
router.post(
    '/:id/restore',
    requireModuleAccess('category', 'update'),
    categoryController.restoreCategory
);

module.exports = router;
