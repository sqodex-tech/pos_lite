import axios from '../axios';

export interface Unit {
    id: string;
    tenantId: string;
    name: string;
    symbol: string;
    description?: string;
    category: 'weight' | 'count' | 'volume' | 'length' | 'area' | 'time';
    baseUnit?: string | null;
    conversionFactor: number;
    precision: number;
    status: 'active' | 'inactive';
    deletedAt?: Date | null;
    createdBy?: string;
    updatedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUnitDto {
    name: string;
    symbol: string;
    description?: string;
    category: 'weight' | 'count' | 'volume' | 'length' | 'area' | 'time';
    baseUnit?: string | null;
    conversionFactor?: number;
    precision?: number;
    status?: 'active' | 'inactive';
}

export interface UpdateUnitDto extends Partial<CreateUnitDto> { }

export interface ConvertUnitsDto {
    value: number;
    fromUnitId: string;
    toUnitId: string;
}

export interface ConversionResult {
    originalValue: number;
    originalUnit: {
        id: string;
        name: string;
        symbol: string;
    };
    convertedValue: number;
    convertedUnit: {
        id: string;
        name: string;
        symbol: string;
    };
    formula: string;
}

export const unitsApi = {
    getAll: (storeId: string, params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: 'weight' | 'count' | 'volume' | 'length' | 'area' | 'time' | 'all';
        status?: 'active' | 'inactive' | 'all';
        includeDeleted?: boolean;
    }) =>
        axios.get('/units', { params: { ...params, storeId } }),

    getByCategory: (storeId: string) =>
        axios.get('/units/by-category', { params: { storeId } }),

    getById: (id: string, storeId: string) =>
        axios.get(`/units/${id}`, { params: { storeId } }),

    create: (storeId: string, data: CreateUnitDto) =>
        axios.post('/units', data, { params: { storeId } }),

    update: (id: string, storeId: string, data: UpdateUnitDto) =>
        axios.patch(`/units/${id}`, data, { params: { storeId } }),

    delete: (id: string, storeId: string) =>
        axios.delete(`/units/${id}`, { params: { storeId } }),

    restore: (id: string, storeId: string) =>
        axios.post(`/units/${id}/restore`, {}, { params: { storeId } }),

    convert: (storeId: string, data: ConvertUnitsDto) =>
        axios.post('/units/convert', { ...data, storeId }),
};
