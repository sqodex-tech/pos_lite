import api from '../axios';

export interface DashboardAnalytics {
    overview: {
        totalSubscriptions: number;
        activeSubscriptions: number;
        trialSubscriptions: number;
        cancelledSubscriptions: number;
        expiredSubscriptions: number;
        suspendedSubscriptions: number;
        pendingSubscriptions: number;
        expiringSoon: number;
        totalTenants: number;
        activeTenants: number;
        suspendedTenants: number;
        totalUsers: number;
    };
    revenue: {
        mrr: number;
        arr: number;
        totalRevenue: number;
        pendingPayments: number;
        failedPayments: number;
        averageRevenuePerUser: number;
        revenueGrowth: number;
        revenueByPeriod: Array<{
            date: string;
            revenue: number;
            count: number;
        }>;
    };
    performance: {
        churnRate: number;
        trialConversionRate: number;
        subscriptionGrowth: number;
        activeRate: number;
    };
    planDistribution: Array<{
        plan: string;
        subscribers: number;
        revenue: number;
        percentage: number;
    }>;
    recentActivities: {
        newSubscriptions: any[];
        cancellations: any[];
    };
}

export const analyticsApi = {
    // Get dashboard analytics
    getDashboard: (params?: { period?: string }) =>
        api.get<{ data: DashboardAnalytics }>('/analytics/dashboard', { params }),
    
    // Get subscription analytics
    getSubscriptions: (params?: { period?: string; groupBy?: string }) =>
        api.get('/analytics/subscriptions', { params }),
    
    // Get revenue analytics
    getRevenue: (params?: { period?: string }) =>
        api.get('/analytics/revenue', { params }),
    
    // Get tenant analytics
    getTenants: (params?: { period?: string }) =>
        api.get('/analytics/tenants', { params }),
    
    // Get cohort analysis
    getCohorts: () =>
        api.get('/analytics/cohorts'),
};
