import api from '../axios';

export interface Expense {
    _id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    storeId: string;
    createdBy: string;
    status: string;
}

export const expensesApi = {
    getAll: (storeIdOrParams?: any, params?: any) => {
        if (typeof storeIdOrParams === 'string') {
            return api.get('/expenses', { params: { ...params, storeId: storeIdOrParams } });
        }
        return api.get('/expenses', { params: storeIdOrParams });
    },

    getSummary: (params?: any) =>
        api.get('/expenses/summary', { params }),

    getById: (id: string) =>
        api.get(`/expenses/${id}`),

    create: (storeIdOrData: any, data?: any) => {
        if (typeof storeIdOrData === 'string' && data) {
            return api.post('/expenses', { ...data, storeId: storeIdOrData });
        }
        return api.post('/expenses', storeIdOrData);
    },

    update: (id: string, data: Partial<Expense>) =>
        api.patch(`/expenses/${id}`, data),

    delete: (id: string) =>
        api.delete(`/expenses/${id}`),
};
