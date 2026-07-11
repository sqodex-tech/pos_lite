import api from '../axios';

export interface Plan {
    _id?: string;
    id?: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    durationInDays: number;
    maxUsers: number;
    maxItems: number;
    maxBranches: number;
    features: string[];
    isActive: boolean;
    isTrialPlan?: boolean;
}

export const plansApi = {
    getAll: () => api.get('/tenants/plans'),

    getById: (id: string) => api.get(`/tenants/plans/${id}`),

    create: (data: Partial<Plan>) => api.post('/tenants/plans', data),

    update: (id: string, data: Partial<Plan>) => api.patch(`/tenants/plans/${id}`, data),

    delete: (id: string) => api.delete(`/tenants/plans/${id}`),
};
