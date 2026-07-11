import api from '../axios';

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    customerType: 'RETAIL' | 'WHOLESALE';
    outstandingBalance?: number; // Added for balance tracking
    storeId: string;
}

export const customersApi = {
    getAll: (storeId: string, params?: any) => api.get('/customers', { params: { ...params, storeId } }),

    getById: (id: string, storeId: string) => api.get(`/customers/${id}`, { params: { storeId } }),

    create: (storeId: string, data: Partial<Customer>) =>
        api.post(`/customers/store/${storeId}`, { ...data, storeId }),

    update: (id: string, storeId: string, data: Partial<Customer>) =>
        api.put(`/customers/${id}`, { ...data, storeId }, { params: { storeId } }),

    delete: (id: string, storeId: string) =>
        api.delete(`/customers/${id}`, { params: { storeId } }),

    recordPayment: (storeId: string, customerId: string, data: any) =>
        api.post(`/customers/store/${storeId}/${customerId}/payment`, { ...data, storeId }),
};
