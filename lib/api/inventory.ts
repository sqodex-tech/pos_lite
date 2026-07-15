import api from '../axios';

export interface Item {
    id: string;
    name: string;
    barcode: string;
    categoryId: string | any;
    brandId?: string | any;
    unitId: string | any;
    purchasePrice: number;
    salePrice: number;
    lowStockAlert: number;
    expiryDate?: string | Date;
    status: 'active' | 'inactive';
    stock?: {
        quantity: number;
    };
}

export const inventoryApi = {
    getAll: (storeId: string, params?: any) =>
        api.get('/inventory', { params: { ...params, storeId } }),

    getById: (id: string, storeId: string, params?: any) =>
        api.get(`/inventory/${id}`, { params: { ...params, storeId } }),

    create: (storeId: string, data: Partial<Item>) =>
        api.post('/inventory', data, { params: { storeId } }),

    update: (id: string, storeId: string, data: Partial<Item>) =>
        api.patch(`/inventory/${id}`, data, { params: { storeId } }),

    delete: (id: string, storeId: string) =>
        api.delete(`/inventory/${id}`, { params: { storeId } }),

    adjustStock: (id: string, storeId: string, data: { quantity: number; reason: string; notes?: string }) =>
        api.post(`/inventory/stock/${storeId}/${id}/adjust`, data),

    getStoreStock: (storeId: string, params?: any) =>
        api.get(`/inventory/stock/${storeId}`, { params }),

    getStockMovements: (storeId: string, itemId: string, params?: any) =>
        api.get(`/inventory/stock/${storeId}/${itemId}/movements`, { params }),

    transferStock: (data: { fromStoreId: string; toStoreId: string; itemId: string; quantity: number; notes?: string }) =>
        api.post(`/inventory/stock/transfer`, data),

    getStats: (storeId: string) =>
        api.get(`/inventory/stats`, { params: { storeId } }),
};
