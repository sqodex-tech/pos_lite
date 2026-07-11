const supplierService = require('../services/supplier.service');
const ApiResponse = require('../utils/ApiResponse');

const createSupplier = async (req, res, next) => {
    try {
        const prisma = require('../config/prisma');
        const ApiError = require('../utils/ApiError');

        // Check subscription limits for contacts
        const activeSubscription = await prisma.subscription.findFirst({
            where: {
                tenantId: req.tenantId,
                status: 'active',
                endDate: { gte: new Date() }
            },
            include: { plan: true }
        });

        if (!activeSubscription) {
            throw new ApiError(403, '⚠️ No Active Subscription! Please subscribe to a plan to add suppliers.');
        }

        const customerCount = await prisma.customer.count({
            where: { tenantId: req.tenantId, deletedAt: null }
        });
        const supplierCount = await prisma.supplier.count({
            where: { tenantId: req.tenantId, deletedAt: null }
        });

        const currentContactCount = customerCount + supplierCount;
        const limitsSnapshot = activeSubscription.limitsSnapshot || {};
        const maxContacts = limitsSnapshot.maxUsers ?? activeSubscription.plan?.maxUsers ?? 5;

        if (currentContactCount >= maxContacts) {
            const planName = activeSubscription.plan?.name || 'current plan';
            throw new ApiError(403, `👥 Contact Limit Reached! You have ${currentContactCount} of ${maxContacts} contact(s) allowed on your ${planName}. Please upgrade to add more customers/suppliers.`);
        }

        const { storeId } = req.params;
        const supplier = await supplierService.createSupplier(req.tenantId, storeId, {
            ...req.body,
            createdById: req.user.id
        });
        return res.status(201).json(new ApiResponse(201, supplier, 'Supplier created successfully'));
    } catch (error) {
        next(error);
    }
};

const getSuppliers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, storeId } = req.query;
        // Prioritize explicit query, then RBAC context, then global interceptor
        const activeStoreId = storeId || req.permissionContext?.storeId || req.headers['x-store-id'];
        
        const result = await supplierService.getSuppliers(req.tenantId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            storeId: activeStoreId
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        };

        return res.status(200).json(new ApiResponse(200, result.suppliers, 'Suppliers fetched successfully', meta));
    } catch (error) {
        next(error);
    }
};

const getSupplierById = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        const supplier = await supplierService.getSupplierById(req.tenantId, req.params.id, storeId);
        return res.status(200).json(new ApiResponse(200, supplier, 'Supplier fetched successfully'));
    } catch (error) {
        next(error);
    }
};

const updateSupplier = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        const supplier = await supplierService.updateSupplier(req.tenantId, req.params.id, req.body, storeId);
        return res.status(200).json(new ApiResponse(200, supplier, 'Supplier updated successfully'));
    } catch (error) {
        next(error);
    }
};

const deleteSupplier = async (req, res, next) => {
    try {
        const storeId = req.storeId || req.params.storeId || req.body.storeId || req.query.storeId || req.headers['x-store-id'];
        await supplierService.deleteSupplier(req.tenantId, req.params.id, storeId);
        return res.status(200).json(new ApiResponse(200, null, 'Supplier deleted successfully'));
    } catch (error) {
        next(error);
    }
};

const recordPayment = async (req, res, next) => {
    try {
        const { storeId, id } = req.params;
        const supplier = await supplierService.recordPayment(
            req.tenantId,
            storeId,
            req.user.id,
            id,
            req.body
        );
        return res.status(200).json(new ApiResponse(200, supplier, 'Payment recorded successfully'));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    recordPayment
};
