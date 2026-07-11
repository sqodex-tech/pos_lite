const express = require('express');
const {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getCurrentUser,
    updateCurrentUser,
    getUsersByStore
} = require('../controllers/user.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize, requireModuleAccess } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate.middleware');
const { createUserSchema, updateUserSchema, updateProfileSchema } = require('../validators/user.validator');

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Current user routes (any authenticated user)
router.get('/me', getCurrentUser);
router.patch('/me', validate(updateProfileSchema), updateCurrentUser);

// Global user management (SUPER_ADMIN / ADMIN)
router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), getAllUsers);

// Store-based user management
router.get('/store/:storeId', requireModuleAccess('staff', 'view'), getUsersByStore);
router.post('/', requireModuleAccess('staff', 'create'), validate(createUserSchema), createUser);
router.get('/:id', requireModuleAccess('staff', 'view'), getUserById);
router.patch('/:id', requireModuleAccess('staff', 'update'), validate(updateUserSchema), updateUser);
router.delete('/:id', requireModuleAccess('staff', 'delete'), deleteUser);

module.exports = router;
