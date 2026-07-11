import api from '../axios';

export const reportsApi = {
    getSalesReport: (storeId: string, params?: any) =>
        api.get(`/reports/store/${storeId}/sales`, { params }),

    getInventoryReport: (storeId: string, params?: any) =>
        api.get(`/reports/store/${storeId}/inventory`, { params }),

    getProfitReport: (storeId: string, params?: any) =>
        api.get(`/reports/store/${storeId}/profit`, { params }),

    getCustomerReport: (storeId: string, params?: any) =>
        api.get(`/reports/store/${storeId}/customer`, { params }),

    getProfitLoss: (params?: any) =>
        api.get('/reports/profit-loss', { params }),
};
