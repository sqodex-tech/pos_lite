const express = require('express');
const { registerUser, registerTenant, loginUser, adminLogin, googleAuth, refreshToken } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerSchema, loginSchema, registerTenantSchema } = require('../validators/auth.validator');
const verifyJWT = require('../middleware/auth.middleware');
const { strictLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

// Tenant self-registration (from web/app) — no tenantId or planId needed
// strictLimiter: 10 req/hr per IP to prevent abuse
router.post('/tenant-register', strictLimiter, validate(registerTenantSchema), registerTenant);

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', loginUser);
router.post('/admin-login', validate(loginSchema), adminLogin);
router.post('/refresh-token', refreshToken);
router.post('/google', googleAuth);

module.exports = router;
