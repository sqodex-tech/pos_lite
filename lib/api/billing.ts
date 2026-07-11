import api from '../axios';

export const billingApi = {
    processRecurring: () => api.post('/billing/process-recurring'),

    retryFailed: () => api.post('/billing/retry-failed'),

    getStats: () => api.get('/billing/stats'),

    getDashboard: (period: string = '30d') => api.get('/billing/dashboard', { params: { period } }),

    // Updated to match the new history endpoint
    getHistory: (tenantId: string, params?: { page?: number; limit?: number; status?: string }) =>
        api.get(`/billing/tenant/${tenantId}/history`, { params }),

    // Legacy support (optional, can be removed if not used elsewhere)
    getCurrentCycle: (tenantId: string) => api.get(`/billing/tenant/${tenantId}/current-cycle`),

    getAllCycles: (tenantId: string, params?: any) =>
        api.get(`/billing/tenant/${tenantId}/cycles`, { params }),
};
