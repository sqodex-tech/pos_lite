const admin = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

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

        // Verify Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Find user by Firebase UID in MySQL
        const user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });

        if (!user) {
            throw new ApiError(401, 'User record not found in database for this Firebase UID');
        }

        req.user = user;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || 'Invalid access token'));
    }
};

module.exports = verifyJWT;
