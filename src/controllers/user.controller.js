const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, tenantId, assignedStores, defaultStoreId } = req.body;

        // Require at least one store assignment for non-admin/non-tenant-admin users
        const isStoreScopedRole = !['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role);
        if (isStoreScopedRole && (!assignedStores || assignedStores.length === 0)) {
            throw new ApiError(400, 'Users must be assigned to at least one store. Please create users through store management.');
        }

        // Determine which tenant to use
        const userTenantId = tenantId || req.user?.tenantId;

        // Verify tenant exists if provided
        if (userTenantId) {
            const tenant = await prisma.tenant.findUnique({ where: { id: userTenantId } });
            if (!tenant) {
                throw new ApiError(404, 'Tenant not found');
            }
            if (tenant.status !== 'active') {
                throw new ApiError(403, 'Cannot create users for inactive tenant');
            }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { email, tenantId: userTenantId }
        });
        if (existingUser) {
            throw new ApiError(409, 'User with this email already exists in this tenant');
        }

        // Check subscription limits for user count (skip for non-counted roles)
        const isCountedRole = !['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role);
        if (userTenantId && isCountedRole) {
            const activeSubscription = await prisma.subscription.findFirst({
                where: {
                    tenantId: userTenantId,
                    status: 'active',
                    endDate: { gte: new Date() }
                },
                include: { plan: true }
            });

            if (!activeSubscription) {
                throw new ApiError(403, '⚠️ No Active Subscription! Please subscribe to a plan to create users.');
            }
        }

        // Validate assigned stores belong to the tenant
        let validAssignedStores = [];
        if (assignedStores && assignedStores.length > 0) {
            const stores = await prisma.store.findMany({
                where: {
                    id: { in: assignedStores },
                    tenantId: userTenantId
                }
            });

            if (stores.length !== assignedStores.length) {
                throw new ApiError(400, 'One or more assigned stores do not belong to this tenant');
            }
            validAssignedStores = stores.map(s => s.id);
        }

        // Validate default store
        let validDefaultStoreId = null;
        if (defaultStoreId) {
            const defaultStore = await prisma.store.findFirst({
                where: {
                    id: defaultStoreId,
                    tenantId: userTenantId
                }
            });

            if (!defaultStore) {
                throw new ApiError(400, 'Default store does not belong to this tenant');
            }
            validDefaultStoreId = defaultStore.id;
        } else if (validAssignedStores.length > 0) {
            // Auto-assign first store as default if not specified
            validDefaultStoreId = validAssignedStores[0];
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: role || 'SALES',
                tenantId: userTenantId,
                assignedStores: validAssignedStores,
                defaultStoreId: validDefaultStoreId
            },
            include: {
                tenant: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        // Omit password equivalent since Prisma handles it or we can manually omit
        const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

        res.status(201).json(
            new ApiResponse(201, userWithoutSensitive, 'User created successfully')
        );
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, role, status, storeId } = req.query;

        // Build query
        const where = {};

        // If not ADMIN or SUPER_ADMIN, filter by tenant
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            where.tenantId = req.user.tenantId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } }
            ];
        }

        if (role) where.role = role;
        if (status) where.status = status;

        // Filter by store if provided
        if (storeId) {
            where.assignedStores = { array_contains: storeId };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const users = await prisma.user.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        const usersCleaned = users.map(({ password, refreshToken, ...user }) => user);
        const count = await prisma.user.count({ where });

        res.status(200).json(
            new ApiResponse(200, usersCleaned, 'Users retrieved successfully', {
                total: count,
                page: Number(page),
                pages: Math.ceil(count / take)
            })
        );
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                tenant: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Check access
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && user.tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        const { password, refreshToken, ...userCleaned } = user;

        res.status(200).json(
            new ApiResponse(200, userCleaned, 'User retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { name, email, password, role, status, tenantId, assignedStores, defaultStoreId } = req.body;

        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Check access
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && user.tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        const data = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (password) data.password = password;
        if (role && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) data.role = role;
        if (status) data.status = status;
        if (tenantId && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) data.tenantId = tenantId;

        // Update assigned stores
        if (assignedStores && Array.isArray(assignedStores)) {
            const stores = await prisma.store.findMany({
                where: {
                    id: { in: assignedStores },
                    tenantId: user.tenantId
                }
            });

            if (stores.length !== assignedStores.length) {
                throw new ApiError(400, 'One or more assigned stores do not belong to this tenant');
            }
            data.assignedStores = stores.map(s => s.id);
        }

        // Update default store
        if (defaultStoreId) {
            const defaultStore = await prisma.store.findFirst({
                where: {
                    id: defaultStoreId,
                    tenantId: user.tenantId
                }
            });

            if (!defaultStore) {
                throw new ApiError(400, 'Default store does not belong to this tenant');
            }
            data.defaultStoreId = defaultStore.id;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.params.id },
            data,
            include: {
                tenant: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        const { password: _, refreshToken: __, ...userCleaned } = updatedUser;

        res.status(200).json(
            new ApiResponse(200, userCleaned, 'User updated successfully')
        );
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Check access
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && user.tenantId !== req.user.tenantId) {
            throw new ApiError(403, 'Access denied');
        }

        // Cannot delete self
        if (user.id === req.user.id) {
            throw new ApiError(403, 'Cannot delete your own account');
        }

        await prisma.user.delete({ where: { id: req.params.id } });

        res.status(200).json(
            new ApiResponse(200, null, 'User deleted successfully')
        );
    } catch (error) {
        next(error);
    }
};

const getCurrentUser = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                tenant: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        const { password, refreshToken, ...userCleaned } = user;

        res.status(200).json(
            new ApiResponse(200, userCleaned, 'Current user retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

const updateCurrentUser = async (req, res, next) => {
    try {
        const { name, email, password, defaultStoreId } = req.body;

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        const data = {};

        if (name) data.name = name;
        if (email) data.email = email;
        if (password) data.password = password;

        // Update default store
        if (defaultStoreId) {
            const defaultStore = await prisma.store.findFirst({
                where: {
                    id: defaultStoreId,
                    tenantId: user.tenantId
                }
            });

            if (!defaultStore) {
                throw new ApiError(400, 'Default store does not belong to your tenant');
            }
            data.defaultStoreId = defaultStore.id;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data,
            include: {
                tenant: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        const { password: _, refreshToken: __, ...userCleaned } = updatedUser;

        res.status(200).json(
            new ApiResponse(200, userCleaned, 'Profile updated successfully')
        );
    } catch (error) {
        next(error);
    }
};

const getUsersByStore = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 20, role } = req.query;

        // Verify store exists and belongs to user's tenant
        const store = await prisma.store.findFirst({
            where: {
                id: storeId,
                tenantId: req.user.tenantId
            }
        });

        if (!store) {
            throw new ApiError(404, 'Store not found or access denied');
        }

        // Build query
        const where = {
            assignedStores: { array_contains: storeId },
            tenantId: req.user.tenantId
        };

        if (role) where.role = role;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const users = await prisma.user.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: { select: { id: true, name: true, email: true, status: true } }
            }
        });

        const usersCleaned = users.map(({ password, refreshToken, ...user }) => user);
        const count = await prisma.user.count({ where });

        res.status(200).json(
            new ApiResponse(200, usersCleaned, 'Store users retrieved successfully', {
                total: count,
                page: Number(page),
                pages: Math.ceil(count / take),
                store: {
                    id: store.id,
                    name: store.name,
                    code: store.code
                }
            })
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getCurrentUser,
    updateCurrentUser,
    getUsersByStore
};
