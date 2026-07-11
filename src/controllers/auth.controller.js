const prisma = require('../config/prisma');
const admin = require('../config/firebase');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const { getRolePermissions } = require('../utils/rolePermissions');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role, tenantId } = req.body;

        const storeOnlyRoles = ['STORE_MANAGER', 'SALES', 'ACCOUNTANT'];
        if (storeOnlyRoles.includes(role) && !tenantId) {
            throw new ApiError(400, `Tenant ID is required for role: ${role}`);
        }

        if (tenantId) {
            const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant) throw new ApiError(404, 'Tenant not found');
            if (tenant.status !== 'active') throw new ApiError(403, 'Cannot register users for inactive tenant');

            const existedUser = await prisma.user.findFirst({ where: { email, tenantId } });
            if (existedUser) throw new ApiError(409, 'User with this email already exists in this tenant');
        } else {
            const existedUser = await prisma.user.findUnique({ where: { email } });
            if (existedUser) throw new ApiError(409, 'User with this email already exists');
        }

        // 1. Create user in Firebase Auth
        let firebaseRecord;
        try {
            firebaseRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name,
            });
        } catch (fbError) {
            if (fbError.code === 'auth/email-already-exists') {
                throw new ApiError(409, 'This email is already registered in Firebase Auth.');
            }
            throw fbError;
        }

        // 2. Create user in MySQL via Prisma
        const user = await prisma.user.create({
            data: {
                firebaseUid: firebaseRecord.uid,
                name,
                email,
                role: role || 'ADMIN',
                tenantId: tenantId || null
            },
            include: { tenant: true }
        });

        return res.status(201).json(
            new ApiResponse(201, user, 'User registered successfully with Firebase and MySQL')
        );
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    // With Firebase Auth, the actual 'login' (checking passwords) happens on the frontend using the Firebase JS SDK.
    // The frontend then sends the Firebase ID Token to this endpoint to sync user data and get effective permissions.
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new ApiError(400, 'Firebase ID token is required in Authorization header');

        const decodedToken = await admin.auth().verifyIdToken(token);
        
        let user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            include: { tenant: true }
        });

        if (!user) throw new ApiError(404, 'User not found in local database');

        if (user.tenantId) {
            const tenant = user.tenant;
            if (!tenant) throw new ApiError(404, 'Tenant not found');
            if (tenant.status === 'suspended') throw new ApiError(403, 'Your tenant account is suspended.');
            if (tenant.status !== 'active') throw new ApiError(403, 'Your tenant account is not active.');
        }

        // Update last login
        user = await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
            include: { tenant: true }
        });

        // Compute effective permissions based on role
        const permissions = getRolePermissions(user.role);

        return res.status(200).json(
            new ApiResponse(200, {
                user: { ...user, permissions },
            }, 'User authenticated via Firebase')
        );
    } catch (error) {
        next(error);
    }
};

const registerTenant = async (req, res, next) => {
    try {
        const { name, email, password, phone, address } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new ApiError(409, 'An account with this email already exists');

        // Create user in Firebase Auth first
        let firebaseRecord;
        try {
            firebaseRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name,
            });
        } catch (fbError) {
            throw new ApiError(400, fbError.message);
        }

        // Create Tenant and Admin User in MySQL using Prisma Transaction
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    email,
                    phone,
                    address,
                    status: 'active'
                }
            });

            const adminUser = await tx.user.create({
                data: {
                    firebaseUid: firebaseRecord.uid,
                    name,
                    email,
                    role: 'ADMIN',
                    tenantId: tenant.id
                }
            });

            return { tenant, adminUser };
        });

        logger.info(`New tenant self-registered: ${result.tenant.name}`);

        return res.status(201).json(
            new ApiResponse(201, result, 'Registration successful! Proceed to Firebase login on frontend.')
        );
    } catch (error) {
        next(error);
    }
};

const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const envEmail = process.env.ADMIN_EMAIL;
        const envPassword = process.env.ADMIN_PASSWORD;

        if (!envEmail || !envPassword) {
            throw new ApiError(500, 'Admin credentials are not configured in the environment variables');
        }

        if (email !== envEmail || password !== envPassword) {
            throw new ApiError(401, 'Invalid admin credentials');
        }

        const permissions = getRolePermissions('SUPER_ADMIN');
        
        const user = {
            id: 'env-admin',
            name: 'Super Admin',
            email: envEmail,
            role: 'SUPER_ADMIN',
            tenantId: null,
            permissions
        };

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
        );

        return res.status(200).json(
            new ApiResponse(200, {
                accessToken,
                refreshToken,
                user
            }, 'Super Admin authenticated successfully')
        );
    } catch (error) {
        next(error);
    }
};

const googleAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new ApiError(400, 'Firebase ID token is required in Authorization header');

        const decodedToken = await admin.auth().verifyIdToken(token);
        
        let user = await prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            include: { tenant: true }
        });

        // If user does not exist, auto-create Tenant and User
        if (!user) {
            const result = await prisma.$transaction(async (tx) => {
                const tenant = await tx.tenant.create({
                    data: {
                        name: `${decodedToken.name || 'User'}'s Store`,
                        email: decodedToken.email || '',
                        phone: 'Not provided',
                        address: 'Not provided',
                        status: 'active'
                    }
                });

                const adminUser = await tx.user.create({
                    data: {
                        firebaseUid: decodedToken.uid,
                        name: decodedToken.name || 'Store Owner',
                        email: decodedToken.email || '',
                        role: 'ADMIN',
                        tenantId: tenant.id
                    },
                    include: { tenant: true }
                });

                return adminUser;
            });

            user = result;
            logger.info(`New tenant self-registered via Google: ${user.tenant.name}`);
        }

        if (user.tenantId) {
            const tenant = user.tenant;
            if (!tenant) throw new ApiError(404, 'Tenant not found');
            if (tenant.status === 'suspended') throw new ApiError(403, 'Your tenant account is suspended.');
            if (tenant.status !== 'active') throw new ApiError(403, 'Your tenant account is not active.');
        }

        // Update last login
        user = await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
            include: { tenant: true }
        });

        const permissions = getRolePermissions(user.role);

        return res.status(200).json(
            new ApiResponse(200, {
                user: { ...user, permissions },
            }, 'User authenticated via Google')
        );
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new ApiError(400, 'Refresh token is required');
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        
        let user;
        if (decoded.id === 'env-admin') {
            user = {
                id: 'env-admin',
                name: 'Super Admin',
                email: decoded.email,
                role: 'SUPER_ADMIN',
                tenantId: null,
                permissions: getRolePermissions('SUPER_ADMIN')
            };
        } else {
            user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: { tenant: true }
            });

            if (!user) {
                throw new ApiError(404, 'User not found');
            }
        }

        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
        );

        return res.status(200).json(
            new ApiResponse(200, {
                accessToken: newAccessToken
            }, 'Token refreshed successfully')
        );
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new ApiError(401, 'Refresh token has expired'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new ApiError(401, 'Invalid refresh token'));
        }
        next(error);
    }
};

module.exports = {
    registerUser,
    registerTenant,
    loginUser,
    adminLogin,
    googleAuth,
    refreshToken
};
