import api from '../axios';

export interface PaymentCycle {
    _id: string;
    tenantId: string | any;
    status: 'pending' | 'paid' | 'failed' | 'overdue' | 'cancelled';
    amount: number;
    billingPeriod: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
}

export const paymentCyclesApi = {
    initialize: (tenantId: string, data: any) =>
        api.post(`/payment-cycles/tenant/${tenantId}/initialize`, data),

    processPayment: (cycleId: string, data: any) =>
        api.post(`/payment-cycles/${cycleId}/process-payment`, data),

    retryPayment: (cycleId: string, data: any) =>
        api.post(`/payment-cycles/${cycleId}/retry-payment`, data),

    getHistory: (tenantId: string, params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }) =>
        api.get(`/payment-cycles/tenant/${tenantId}/history`, { params }),

    getAnalytics: (tenantId: string) =>
        api.get(`/payment-cycles/tenant/${tenantId}/analytics`),

    getCurrent: (tenantId: string) =>
        api.get(`/payment-cycles/tenant/${tenantId}/current`),

    getById: (cycleId: string) =>
        api.get(`/payment-cycles/${cycleId}`),

    getAll: (params?: { page?: number; limit?: number; status?: string; tenantId?: string }) =>
        api.get('/payment-cycles', { params }),

    cancel: (cycleId: string, data: { reason: string }) =>
        api.patch(`/payment-cycles/${cycleId}/cancel`, data),
};
