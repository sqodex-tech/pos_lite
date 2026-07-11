import api from '../axios';

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    paymentTermsDays: number;
    balance: number;
    storeId: string;
}

export const suppliersApi = {
    getAll: (params?: any) => {
        const storeId = typeof window !== 'undefined' ? localStorage.getItem('storeId') : undefined;
        return api.get('/suppliers', { params: { ...params, storeId } });
    },
    getById: (id: string, storeId: string) => api.get(`/suppliers/${id}`, { params: { storeId } }),
    
    create: (storeId: string, data: Partial<Supplier>) =>
        api.post(`/suppliers/store/${storeId}`, { ...data, storeId }),
    update: (id: string, storeId: string, data: Partial<Supplier>) =>
        api.put(`/suppliers/${id}`, { ...data, storeId }, { params: { storeId } }),
    
    delete: (id: string, storeId: string) =>
        api.delete(`/suppliers/${id}`, { params: { storeId } }),

    recordPayment: (storeId: string, supplierId: string, data: any) =>
        api.post(`/suppliers/store/${storeId}/${supplierId}/payment`, { ...data, storeId }),
};
