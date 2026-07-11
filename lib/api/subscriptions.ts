import api from '../axios';

export interface Subscription {
    _id?: string;
    id?: string;
    tenantId: {
        _id?: string;
        id?: string;
        name: string;
        email: string;
    };
    planId: {
        _id?: string;
        id?: string;
        name: string;
        price: number;
        maxUsers: number;
        maxItems: number;
        maxBranches: number;
        features: string[];
    };
    status: 'active' | 'cancelled' | 'expired' | 'suspended' | 'pending';
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    cancelledAt?: string;
    cancelReason?: string;
    priceSnapshot: {
        amount: number;
        currency: string;
        durationInDays: number;
    };
    limitsSnapshot: {
        maxUsers: number;
        maxItems: number;
        maxBranches: number;
    };
    isTrial: boolean;
    trialEndsAt?: string;
    lastPaymentDate?: string;
    nextPaymentDate?: string;
    paymentStatus: 'paid' | 'pending' | 'failed' | 'overdue';
    notes?: string;
    daysRemaining?: number;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionStats {
    totalActive: number;
    totalCancelled: number;
    totalExpired: number;
    expiringSoon: number;
    trialSubscriptions: number;
    monthlyRecurringRevenue: number;
    churnRate: string;
}

export const subscriptionsApi = {
    // Activate subscription
    activate: (tenantId: string, data: { planId: string; autoRenew?: boolean; isTrial?: boolean }) =>
        api.post(`/subscriptions/tenant/${tenantId}/activate`, data),

    // Approve subscription
    approve: (subscriptionId: string) =>
        api.post(`/subscriptions/${subscriptionId}/approve`),

    // Get active subscription for tenant
    getActive: (tenantId: string) =>
        api.get(`/subscriptions/tenant/${tenantId}/active`),

    // Get subscription history for tenant
    getHistory: (tenantId: string, params?: { page?: number; limit?: number; status?: string }) =>
        api.get(`/subscriptions/tenant/${tenantId}/history`, { params }),

    // Change plan
    changePlan: (subscriptionId: string, data: { newPlanId: string; immediate?: boolean }) =>
        api.post(`/subscriptions/${subscriptionId}/change-plan`, data),

    // Cancel subscription
    cancel: (subscriptionId: string, data: { reason?: string; immediate?: boolean }) =>
        api.post(`/subscriptions/${subscriptionId}/cancel`, data),

    // Renew subscription
    renew: (subscriptionId: string) =>
        api.post(`/subscriptions/${subscriptionId}/renew`),

    // Get all subscriptions (ADMIN)
    getAll: (params?: { page?: number; limit?: number; status?: string; planId?: string; expiringSoon?: boolean }) =>
        api.get('/subscriptions', { params }),

    // Get subscription statistics
    getStats: () =>
        api.get('/subscriptions/stats'),
};
