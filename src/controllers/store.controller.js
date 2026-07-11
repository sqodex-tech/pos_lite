const storeService = require('../services/store.service');
const ApiResponse = require('../utils/ApiResponse');
const cache = require('../utils/cache.service');
const ApiError = require('../utils/ApiError');
const rbacService = require('../services/rbac.service');

const createStore = async (req, res, next) => {
    try {
        const store = await storeService.createStore(req.tenantId, req.body);

        cache.delStartWith(`stores_${req.tenantId}`);

        // Seed default store permissions
        await rbacService.seedStoreDefaults(req.tenantId, store._id);

        return res.status(201).json(
            new ApiResponse(201, store, 'Store created successfully')
        );
    } catch (error) {
        next(error);
    }
};

const getStores = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const cacheKey = `stores_${req.tenantId}_${page}_${limit}_${search || ''}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(new ApiResponse(200, cachedData.stores, 'Stores fetched successfully (cached)', cachedData.meta));
        }

        const result = await storeService.getStores(req.tenantId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages: totalPages,
            hasMore: result.page < totalPages
        };

        cache.set(cacheKey, { stores: result.stores, meta });

        return res.status(200).json(
            new ApiResponse(200, result.stores, 'Stores fetched successfully', meta)
        );
    } catch (error) {
        next(error);
    }
};

const getStoreById = async (req, res, next) => {
    try {
        const store = await storeService.getStoreById(req.tenantId, req.params.id);

        return res.status(200).json(
            new ApiResponse(200, store, 'Store fetched successfully')
        );
    } catch (error) {
        next(error);
    }
};

const updateStore = async (req, res, next) => {
    try {
        const store = await storeService.updateStore(req.tenantId, req.params.id, req.body);

        cache.delStartWith(`stores_${req.tenantId}`);
        return res.status(200).json(new ApiResponse(200, store, 'Store updated successfully'));
    } catch (error) {
        next(error);
    }
};

const deleteStore = async (req, res, next) => {
    try {
        await storeService.deleteStore(req.tenantId, req.params.id);

        cache.delStartWith(`stores_${req.tenantId}`);
        return res.status(200).json(new ApiResponse(200, null, 'Store deleted successfully'));
    } catch (error) {
        next(error);
    }
};

const getStoreStats = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const prisma = require('../config/prisma');

        // Verify store exists and belongs to tenant
        const store = await prisma.store.findFirst({
            where: {
                id: storeId,
                tenantId: req.tenantId
            }
        });

        if (!store) {
            throw new ApiError(404, 'Store not found');
        }

        // Get staff count by role
        const staffByRoleRaw = await prisma.user.groupBy({
            by: ['role'],
            where: {
                // assignedStores requires raw query or different logic if stored as JSON array.
                // For Prisma JSON filtering where assignedStores contains storeId
                assignedStores: { array_contains: store.id },
                tenantId: store.tenantId,
                deletedAt: null
            },
            _count: {
                _all: true
            }
        });

        // Get total staff
        const totalStaff = await prisma.user.count({
            where: {
                assignedStores: { array_contains: store.id },
                tenantId: store.tenantId,
                deletedAt: null
            }
        });

        // Get active staff
        const activeStaff = await prisma.user.count({
            where: {
                assignedStores: { array_contains: store.id },
                tenantId: store.tenantId,
                status: 'active',
                deletedAt: null
            }
        });

        const stats = {
            store: {
                id: store.id,
                name: store.name,
                code: store.code,
                status: store.status
            },
            staff: {
                total: totalStaff,
                active: activeStaff,
                inactive: totalStaff - activeStaff,
                byRole: staffByRoleRaw.reduce((acc, item) => {
                    acc[item.role] = item._count._all;
                    return acc;
                }, {})
            }
        };

        return res.status(200).json(
            new ApiResponse(200, stats, 'Store stats fetched successfully')
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStore,
    getStores,
    getStoreById,
    updateStore,
    deleteStore,
    getStoreStats
};

