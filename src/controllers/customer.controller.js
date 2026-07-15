const customerService = require('../services/customer.service');
const ApiResponse = require('../utils/ApiResponse');

const createCustomer = async (req, res, next) => {
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
            throw new ApiError(403, '⚠️ No Active Subscription! Please subscribe to a plan to add customers.');
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
        const customer = await customerService.createCustomer(req.tenantId, storeId, {
            ...req.body,
            createdById: req.user.id
        });
        return res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
    } catch (error) {
        next(error);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, storeId: queryStoreId, startDate, endDate } = req.query;
        const storeId = queryStoreId || req.permissionContext?.storeId;

        const result = await customerService.getCustomers(req.tenantId, {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            storeId,
            startDate,
            endDate
        });

        const totalPages = Math.ceil(result.total / result.limit);
        const meta = {
            total: result.total,
            page: result.page,
            totalPages,
            hasMore: result.page < totalPages
        };

        return res.status(200).json(new ApiResponse(200, result.customers, 'Customers fetched successfully', meta));
    } catch (error) {
        next(error);
    }
};

const getCustomerById = async (req, res, next) => {
    try {
        const storeId = req.query.storeId || req.permissionContext?.storeId;
        const customer = await customerService.getCustomerById(req.tenantId, req.params.id, storeId);
        return res.status(200).json(new ApiResponse(200, customer, 'Customer fetched successfully'));
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const storeId = req.query.storeId || req.permissionContext?.storeId;
        const customer = await customerService.updateCustomer(req.tenantId, req.params.id, req.body, storeId);
        return res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        const storeId = req.query.storeId || req.permissionContext?.storeId;
        await customerService.deleteCustomer(req.tenantId, req.params.id, storeId);
        return res.status(200).json(new ApiResponse(200, null, 'Customer deleted successfully'));
    } catch (error) {
        next(error);
    }
};

const recordPayment = async (req, res, next) => {
    try {
        const { storeId, id } = req.params;
        const customer = await customerService.recordPayment(
            req.tenantId,
            storeId,
            req.user.id,
            id,
            req.body
        );
        return res.status(200).json(new ApiResponse(200, customer, 'Payment recorded successfully'));
    } catch (error) {
        console.error("DEBUG MANUAL PAYMENT ERROR:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

const getCustomerStats = async (req, res, next) => {
    try {
        const prisma = require('../config/prisma');
        const storeId = req.query.storeId || req.permissionContext?.storeId;
        
        const where = { tenantId: req.tenantId, deletedAt: null };
        if (storeId) {
            where.storeId = storeId;
        }

        const customers = await prisma.customer.findMany({
            where,
            select: { customerType: true, outstandingBalance: true }
        });

        const stats = {
            total: customers.length,
            retail: customers.filter(c => c.customerType === 'RETAIL').length,
            wholesale: customers.filter(c => c.customerType === 'WHOLESALE').length,
            totalBalance: customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0)
        };

        return res.status(200).json(new ApiResponse(200, stats, 'Customer stats fetched successfully'));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    recordPayment,
    getCustomerStats
};
