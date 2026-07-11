import api from '../axios';

export interface Brand {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    status: 'active' | 'inactive';
    storeId: string;
}

export const brandsApi = {
    getAll: (storeId: string, params?: any) => 
        api.get('/brands', { params: { ...params, storeId } }),

    getById: (id: string, storeId: string) => 
        api.get(`/brands/${id}`, { params: { storeId } }),

    create: (storeId: string, data: Partial<Brand>) => 
        api.post(`/brands`, data, { params: { storeId } }),

    update: (id: string, storeId: string, data: Partial<Brand>) => 
        api.put(`/brands/${id}`, data, { params: { storeId } }),

    delete: (id: string, storeId: string) => 
        api.delete(`/brands/${id}`, { params: { storeId } }),
};
