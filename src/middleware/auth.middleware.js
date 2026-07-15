const admin = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');
const cacheService = require('../utils/cache.service');

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError(401, 'Unauthorized request. No token provided.');
        }

        // Try local JWT verification first (for env-based Super Admin)
        try {
            const decodedLocal = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_for_development');
            if (decodedLocal && decodedLocal.role === 'SUPER_ADMIN') {
                req.user = decodedLocal;
                return next();
            }
        } catch (e) {
            // Not a local JWT, or expired. Fall back to Firebase below.
        }

        // Check cache for this specific token to skip Firebase network/crypto verification and Database queries
        const cacheKey = `auth_token_${token.substring(0, 50)}...${token.slice(-10)}`;
        const cachedUser = cacheService.get(cacheKey);
        
        if (cachedUser) {
            req.user = cachedUser;
            return next();
        }

        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Find user by Firebase UID in MySQL
        const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!user) {
            throw new ApiError(401, 'User record not found in database for this Firebase UID');
        }

        // Cache the resolved user for 5 minutes (300 seconds)
        cacheService.set(cacheKey, user, 300);

        req.user = user;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || 'Invalid access token'));
    }
};

module.exports = verifyJWT;
