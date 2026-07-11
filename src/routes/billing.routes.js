const express = require('express');
const router = express.Router();
const BillingService = require('../services/billing.service');
const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');
const verifyJWT = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

// All billing routes are protected
router.use(verifyJWT);

/**
 * @desc Process recurring billing (Super Admin only)
 * @route POST /api/v1/billing/process-recurring
 */
router.post('/process-recurring', authorize('SUPER_ADMIN'), async (req, res, next) => {
    try {
        const result = await BillingService.processRecurringBilling();
        res.status(200).json(new ApiResponse(200, result, 'Recurring billing processed successfully'));
    } catch (error) {
        next(error);
    }
});

/**
 * @desc Get billing statistics (Super Admin only)
 * @route GET /api/v1/billing/stats
 */
router.get('/stats', authorize('SUPER_ADMIN'), async (req, res, next) => {
    try {
        const stats = await BillingService.getBillingStats();
        res.status(200).json(new ApiResponse(200, stats));
    } catch (error) {
        next(error);
    }
});

/**
 * @desc Get billing history for a tenant with pagination
 * @route GET /api/v1/billing/tenant/:tenantId/history
 */
router.get('/tenant/:tenantId/history', authorize('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
    try {
        const { tenantId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        // Check if user has access to this tenant (SUPER_ADMIN has access to all)
        if (req.user.role !== 'SUPER_ADMIN' && req.user.tenantId !== tenantId) {
            return res.status(403).json(new ApiResponse(403, null, 'Access denied'));
        }

        const where = { tenantId };
        if (status) where.status = status;

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        const history = await prisma.billingHistory.findMany({
            where,
            include: {
                subscription: true
            },
            orderBy: { billingDate: 'desc' },
            take: limitNum,
            skip: (pageNum - 1) * limitNum
        });

        const total = await prisma.billingHistory.count({ where });

        res.status(200).json(new ApiResponse(200, history, 'Billing history retrieved', {
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            hasMore: pageNum * limitNum < total
        }));
    } catch (error) {
        next(error);
    }
});

/**
 * @desc Get billing dashboard data (SUPER_ADMIN)
 * @route GET /api/v1/billing/dashboard
 */
router.get('/dashboard', authorize('SUPER_ADMIN'), async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get billing statistics
        const stats = await BillingService.getBillingStats();

        // Get recent billing history
        const recentHistory = await prisma.billingHistory.findMany({
            where: {
                billingDate: { gte: startDate, lte: endDate }
            },
            include: {
                tenant: {
                    select: { name: true, email: true }
                },
                subscription: {
                    include: {
                        plan: { select: { name: true } }
                    }
                }
            },
            orderBy: { billingDate: 'desc' },
            take: 50
        });

        // Get payment trends
        // Note: Using a raw query or fetching and processing in memory since Prisma
        // doesn't support generic group by date natively yet easily without raw.
        // Doing simple memory aggregation given typical data size for dashboard trend.
        
        const historyForTrends = await prisma.billingHistory.findMany({
            where: {
                billingDate: { gte: startDate, lte: endDate }
            },
            select: {
                billingDate: true,
                status: true,
                amount: true
            }
        });
        
        const trendsMap = {};
        historyForTrends.forEach(record => {
            // format YYYY-MM-DD
            const dateStr = record.billingDate.toISOString().split('T')[0];
            const key = `${dateStr}_${record.status}`;
            if (!trendsMap[key]) {
                trendsMap[key] = {
                    _id: { date: dateStr, status: record.status },
                    count: 0,
                    amount: 0
                };
            }
            trendsMap[key].count += 1;
            trendsMap[key].amount += record.amount;
        });

        const paymentTrends = Object.values(trendsMap).sort((a, b) => a._id.date.localeCompare(b._id.date));

        const dashboardData = {
            stats,
            recentHistory,
            paymentTrends,
            period: {
                start: startDate,
                end: endDate
            }
        };

        res.status(200).json(new ApiResponse(200, dashboardData));
    } catch (error) {
        next(error);
    }
});

module.exports = router;