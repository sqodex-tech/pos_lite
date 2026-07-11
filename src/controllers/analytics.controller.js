const prisma = require('../config/prisma');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * @desc Get tenant dashboard analytics
 * @route GET /api/v1/analytics/dashboard
 * @access ADMIN
 */
exports.getDashboardAnalytics = async (req, res, next) => {
    try {
        const { period = '30' } = req.query; // days
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Define query filter based on role
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
        const where = isSuperAdmin ? {} : { tenantId: req.user.tenantId };
        const tenantId = req.user.tenantId;

        // Parallel queries
        const [
            activeSubscriptionsCount,
            trialSubscriptionsCount,
            totalTenantsCount,
            activeTenantsCount,
            totalUsersCount,
            expiringSoonCount,
            allSubscribers,
            recentSubscriptions,
            billingHistory
        ] = await Promise.all([
            prisma.subscription.count({ where: { ...where, status: 'active' } }),
            prisma.subscription.count({ where: { ...where, status: 'active', isTrial: true } }),
            prisma.tenant.count({ where: isSuperAdmin ? {} : { id: req.user.tenantId } }),
            prisma.tenant.count({
                where: {
                    ...(isSuperAdmin ? {} : { id: req.user.tenantId }),
                    status: 'active'
                }
            }),
            prisma.user.count({ where }),
            prisma.subscription.count({
                where: {
                    ...where,
                    status: 'active',
                    endDate: {
                        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        gt: new Date()
                    }
                }
            }),
            prisma.subscription.findMany({ where: { ...where, status: 'active' }, include: { plan: true } }),
            prisma.subscription.findMany({
                where,
                include: { tenant: { select: { name: true } }, plan: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            prisma.billingHistory.findMany({
                where: {
                    ...where,
                    billingDate: { gte: startDate },
                    status: 'paid'
                }
            })
        ]);

        const totalRevenueData = await prisma.billingHistory.aggregate({
            where: { ...where, status: 'paid' },
            _sum: { amount: true }
        });

        const totalRevenue = totalRevenueData._sum.amount || 0;

        // Calculate MRR from active subscriptions
        const mrr = allSubscribers.reduce((sum, sub) => {
            const priceSnapshot = sub.priceSnapshot || {};
            if (priceSnapshot.amount && priceSnapshot.durationInDays) {
                // Approximate monthly revenue (30 days)
                return sum + (priceSnapshot.amount / priceSnapshot.durationInDays) * 30;
            }
            return sum;
        }, 0);

        // Group revenue by day for charts (if needed by frontend later)
        const revenueByPeriod = billingHistory.reduce((acc, curr) => {
            const date = curr.billingDate.toISOString().split('T')[0];
            if (!acc[date]) acc[date] = { date, revenue: 0, count: 0 };
            acc[date].revenue += curr.amount;
            acc[date].count += 1;
            return acc;
        }, {});

        // Calculate Plan Distribution
        const planMap = new Map();
        allSubscribers.forEach(sub => {
            const name = sub.plan?.name || 'Unknown';
            const current = planMap.get(name) || { plan: name, subscribers: 0, revenue: 0 };
            current.subscribers += 1;
            current.revenue += (sub.priceSnapshot?.amount || 0);
            planMap.set(name, current);
        });

        const planDistribution = Array.from(planMap.values()).map(item => ({
            ...item,
            percentage: activeSubscriptionsCount > 0
                ? Math.round((item.subscribers / activeSubscriptionsCount) * 100)
                : 0
        }));

        const analytics = {
            overview: {
                totalTenants: totalTenantsCount,
                activeTenants: activeTenantsCount,
                totalUsers: totalUsersCount,
                activeSubscriptions: activeSubscriptionsCount,
                trialSubscriptions: trialSubscriptionsCount,
                expiringSoon: expiringSoonCount,
                totalRevenue
            },
            revenue: {
                mrr: Math.round(mrr),
                totalRevenue,
                revenueGrowth: 0, // Placeholder for now
                revenueByDay: Object.values(revenueByPeriod).sort((a, b) => a.date.localeCompare(b.date))
            },
            performance: {
                churnRate: 0, // Placeholder
                trialConversionRate: 0, // Placeholder
            },
            planDistribution,
            recentActivities: {
                newSubscriptions: recentSubscriptions,
                billing: billingHistory.slice(0, 5) // Last 5 paid items
            }
        };

        res.status(200).json(new ApiResponse(200, analytics, 'Dashboard analytics retrieved'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get subscription analytics for tenant
 * @route GET /api/v1/analytics/subscriptions
 * @access ADMIN
 */
exports.getSubscriptionAnalytics = async (req, res, next) => {
    try {
        const where = req.user.role === 'SUPER_ADMIN' ? {} : { tenantId: req.user.tenantId };

        const subscriptions = await prisma.subscription.findMany({
            where,
            include: { plan: true },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(new ApiResponse(200, {
            subscriptions,
            totalCount: subscriptions.length
        }, 'Subscription analytics retrieved'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get revenue analytics for tenant
 * @route GET /api/v1/analytics/revenue
 * @access ADMIN
 */
exports.getRevenueAnalytics = async (req, res, next) => {
    try {
        const { period = '90' } = req.query;
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const where = req.user.role === 'SUPER_ADMIN' ? {} : { tenantId: req.user.tenantId };

        const revenueData = await prisma.billingHistory.findMany({
            where: {
                ...where,
                billingDate: { gte: startDate },
                status: 'paid'
            },
            orderBy: { billingDate: 'asc' }
        });

        res.status(200).json(new ApiResponse(200, {
            revenueData,
            period: `${period} days`
        }, 'Revenue analytics retrieved'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get tenant analytics
 * @route GET /api/v1/analytics/tenants
 * @access ADMIN
 */
exports.getTenantAnalytics = async (req, res, next) => {
    try {
        const tenantId = req.user.tenantId;
        if (!tenantId && req.user.role === 'SUPER_ADMIN') {
            return res.status(200).json(new ApiResponse(200, { message: 'Super Admin has no specific tenant' }));
        }
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        res.status(200).json(new ApiResponse(200, tenant, 'Tenant analytics retrieved'));
    } catch (error) {
        next(error);
    }
};

/**
 * @desc Get cohort analysis (Global - Deprecated/Restricted to System)
 * @route GET /api/v1/analytics/cohorts
 * @access System
 */
exports.getCohortAnalysis = async (req, res, next) => {
    res.status(200).json(new ApiResponse(200, { cohorts: [] }, 'Cohort analysis is no longer available'));
};

module.exports = exports;
