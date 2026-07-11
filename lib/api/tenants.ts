import api from '../axios';

export interface Tenant {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    planId: {
        _id: string;
        name: string;
        price: number;
    };
    status: 'active' | 'suspended' | 'inactive';
    hasUsedTrial: boolean;
    createdAt: string;
}

export interface TenantCreateUpdate {
    name: string;
    email: string;
    phone: string;
    address: string;
    planId: string;
}

export const tenantsApi = {
    getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
        api.get('/tenants', { params }),

    getById: (id: string) =>
        api.get(`/tenants/${id}`),

    create: (data: Partial<TenantCreateUpdate>) =>
        api.post('/tenants', data),

    update: (id: string, data: Partial<TenantCreateUpdate>) =>
        api.patch(`/tenants/${id}`, data),

    updateStatus: (id: string, status: string) =>
        api.patch(`/tenants/${id}/status`, { status }),

    delete: (id: string) =>
        api.delete(`/tenants/${id}`),

    getBillingHistory: (id: string) =>
        api.get(`/tenants/${id}/billing-history`),
};
