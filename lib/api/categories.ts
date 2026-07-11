import axios from '../axios';

export interface Category {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    parentId?: string | null;
    level: number;
    path: string;
    icon?: string;
    color?: string;
    sortOrder: number;
    status: 'active' | 'inactive';
    deletedAt?: Date | null;
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
    children?: Category[];
}

export interface CategoryTree extends Category {
    children: CategoryTree[];
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentId?: string | null;
    icon?: string;
    color?: string;
    sortOrder?: number;
    status?: 'active' | 'inactive';
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> { }

export const categoriesApi = {
    getAll: (storeId: string, params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: 'active' | 'inactive' | 'all';
        parentId?: string | null;
        includeDeleted?: boolean;
    }) =>
        axios.get('/categories', { params: { ...params, storeId } }),

    getTree: (storeId: string) =>
        axios.get('/categories/tree', { params: { storeId } }),

    getById: (id: string, storeId: string) =>
        axios.get(`/categories/${id}`, { params: { storeId } }),

    create: (storeId: string, data: CreateCategoryDto) =>
        axios.post('/categories', data, { params: { storeId } }),

    update: (id: string, storeId: string, data: UpdateCategoryDto) =>
        axios.patch(`/categories/${id}`, data, { params: { storeId } }),

    delete: (id: string, storeId: string) =>
        axios.delete(`/categories/${id}`, { params: { storeId } }),

    restore: (id: string, storeId: string) =>
        axios.post(`/categories/${id}/restore`, {}, { params: { storeId } }),
};
