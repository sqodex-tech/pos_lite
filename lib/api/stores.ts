import api from '../axios';

export interface Store {
    _id: string;
    id?: string;
    name: string;
    code: string;
    address: string;
    phone: string;
    email?: string;
    status: 'active' | 'inactive';
    tenantId: string | {
        _id: string;
        name: string;
        email?: string;
        status?: string;
    };
    managerUserId?: string;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface StoreCreateUpdate {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    status?: 'active' | 'inactive';
}

export interface StoreResponse {
    data: Store[];
    meta?: any;
}

export interface SingleStoreResponse {
    data: Store;
}

// ── Tenant-Scoped Store API ──
export const storesApi = {
    getAll: (params?: any) => api.get<StoreResponse>('/stores', { params }),

    getById: (id: string) => api.get<SingleStoreResponse>(`/stores/${id}`),

    create: (data: Partial<Store>) => api.post<SingleStoreResponse>('/stores', data),

    update: (id: string, data: Partial<Store>) => api.patch<SingleStoreResponse>(`/stores/${id}`, data),

    delete: (id: string) => api.delete(`/stores/${id}`),

    getStats: (id: string, params?: any) => api.get(`/stores/${id}/stats`, { params }),
};

// ── Super Admin Cross-Tenant Store API ──
export const adminStoresApi = {
    getAll: (params?: { page?: number; limit?: number; search?: string; tenantId?: string }) =>
        api.get('/tenants/stores/all', { params }),

    create: (tenantId: string, data: StoreCreateUpdate) =>
        api.post(`/tenants/${tenantId}/stores`, data),

    update: (tenantId: string, storeId: string, data: Partial<StoreCreateUpdate>) =>
        api.patch(`/tenants/${tenantId}/stores/${storeId}`, data),

    delete: (tenantId: string, storeId: string) =>
        api.delete(`/tenants/${tenantId}/stores/${storeId}`),
};
