const itemRepository = require('../repositories/item.repository');
const inventoryService = require('../services/inventory.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const cache = require('../utils/cache.service');

const createItem = async (req, res, next) => {
    try {
        const prisma = require('../config/prisma');
        
        // Check subscription limits for item count
        const activeSubscription = await prisma.subscription.findFirst({
            where: {
                tenantId: req.tenantId,
                status: 'active',
                endDate: { gte: new Date() }
            },
            include: { plan: true }
        });

        if (!activeSubscription) {
            throw new ApiError(403, '⚠️ No Active Subscription! Please subscribe to a plan to create inventory items.');
        }

        // Count current items
        const currentItemCount = await prisma.item.count({ 
            where: {
                tenantId: req.tenantId,
                deletedAt: null
            }
        });

        const limitsSnapshot = activeSubscription.limitsSnapshot || {};
        const maxItems = limitsSnapshot.maxItems ?? 
                        activeSubscription.plan?.maxItems ?? 100;

        if (currentItemCount >= maxItems) {
            const planName = activeSubscription.plan?.name || 'current plan';
            throw new ApiError(403, `📦 Inventory Limit Reached! You have ${currentItemCount} of ${maxItems} item(s) allowed on your ${planName}. Please upgrade to add more items.`);
        }

        const storeId = req.query.storeId || req.headers['x-store-id'] || req.body.storeId;
        const userId = req.user?.id || req.body.userId;
        const item = await inventoryService.createItem(req.tenantId, storeId, req.body, userId);
        cache.delStartWith(`items_${req.tenantId}`);
        return res.status(201).json(new ApiResponse(201, item, 'Item created successfully'));
    } catch (error) {
        next(error);
    }
};

const getItems = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, storeId: queryStoreId } = req.query;
        const storeId = queryStoreId || req.permissionContext?.storeId || req.headers['x-store-id'];
        
        const cacheKey = `items_${req.tenantId}_${storeId || 'all'}_${page}_${limit}_${search || ''}`;

        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(new ApiResponse(200, cachedData.items, 'Items fetched successfully (cached)', cachedData.meta));
        }

        const userId = req.user?.id;

        const result = await inventoryService.getItems(req.tenantId, storeId, userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            storeId
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        };

        cache.set(cacheKey, { items: result.items, meta });

        return res.status(200).json(new ApiResponse(200, result.items, 'Items fetched successfully', meta));
    } catch (error) {
        next(error);
    }
};

const getItemById = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        const userId = req.user?.id;
        const item = await inventoryService.getItemById(req.tenantId, storeId, req.params.id, userId);
        if (!item) throw new ApiError(404, 'Item not found');

        return res.status(200).json(new ApiResponse(200, item, 'Item fetched successfully'));
    } catch (error) {
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        const userId = req.user?.id;
        const item = await inventoryService.updateItem(req.tenantId, storeId, req.params.id, req.body, userId);
        if (!item) throw new ApiError(404, 'Item not found');

        cache.delStartWith(`items_${req.tenantId}`);
        return res.status(200).json(new ApiResponse(200, item, 'Item updated successfully'));
    } catch (error) {
        next(error);
    }
};

const deleteItem = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        const userId = req.user?.id;
        const result = await inventoryService.deleteItem(req.tenantId, storeId, req.params.id, userId);
        if (!result) throw new ApiError(404, 'Item not found');

        cache.delStartWith(`items_${req.tenantId}`);
        return res.status(200).json(new ApiResponse(200, null, 'Item deleted successfully'));
    } catch (error) {
        next(error);
    }
};

const getStoreStock = async (req, res, next) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 20, lowStockOnly, search } = req.query;
        const stockService = require('../services/stock.service');
        
        const result = await stockService.getStoreStock(req.tenantId, storeId, {
            page: parseInt(page),
            limit: parseInt(limit),
            lowStockOnly: lowStockOnly === 'true',
            search
        });

        const totalPages = Math.ceil(result.total / result.limit);

        return res.status(200).json(new ApiResponse(200, result.stocks, 'Store stock fetched successfully', {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        }));
    } catch (error) {
        next(error);
    }
};

const getStockMovements = async (req, res, next) => {
    try {
        const { storeId, itemId } = req.params;
        const { page = 1, limit = 50, startDate, endDate } = req.query;
        const stockService = require('../services/stock.service');
        
        const result = await stockService.getStockMovements(storeId, itemId, {
            page: parseInt(page),
            limit: parseInt(limit),
            startDate,
            endDate
        });

        const totalPages = Math.ceil(result.total / result.limit);

        return res.status(200).json(new ApiResponse(200, result.movements, 'Stock movements fetched successfully', {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        }));
    } catch (error) {
        next(error);
    }
};

const adjustStock = async (req, res, next) => {
    try {
        const { storeId, itemId } = req.params;
        const { quantity, reason, notes } = req.body;
        const stockService = require('../services/stock.service');
        
        if (typeof quantity !== 'number' || quantity < 0) {
            throw new ApiError(400, 'Quantity must be a positive number');
        }
        
        if (!reason) {
            throw new ApiError(400, 'Reason is required for stock adjustment');
        }

        const stock = await stockService.adjustStock(
            req.tenantId,
            storeId,
            itemId,
            quantity,
            reason,
            req.user.id,
            notes
        );

        return res.status(200).json(new ApiResponse(200, stock, 'Stock adjusted successfully'));
    } catch (error) {
        next(error);
    }
};

const transferStock = async (req, res, next) => {
    try {
        const { fromStoreId, toStoreId, itemId, quantity, notes } = req.body;
        const stockService = require('../services/stock.service');
        
        if (!fromStoreId || !toStoreId || !itemId || !quantity) {
            throw new ApiError(400, 'fromStoreId, toStoreId, itemId, and quantity are required');
        }
        
        if (quantity <= 0) {
            throw new ApiError(400, 'Quantity must be greater than 0');
        }
        
        if (fromStoreId === toStoreId) {
            throw new ApiError(400, 'Cannot transfer to the same store');
        }

        const result = await stockService.transferStock(
            req.tenantId,
            fromStoreId,
            toStoreId,
            itemId,
            quantity,
            req.user.id,
            notes
        );

        return res.status(200).json(new ApiResponse(200, result, 'Stock transferred successfully'));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    getStoreStock,
    getStockMovements,
    adjustStock,
    transferStock
};
