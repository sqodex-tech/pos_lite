import api from '../axios';

export interface User {
    _id: string;
    id?: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    tenantId?: {
        _id: string;
        name: string;
        email: string;
        status: string;
    };
    defaultStoreId?: {
        _id: string;
        name: string;
    };
    assignedStores?: string[];
    status: 'active' | 'inactive';
    permissions?: string[];
    customPermissions?: string[];
    permissionOverrides?: {
        granted: string[];
        revoked: string[];
    };
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserCreateUpdate {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role: string;
    tenantId?: string;
    defaultStoreId?: string;
    assignedStores?: string[];
    status?: 'active' | 'inactive';
}

export const usersApi = {
    // Get all users
    getAll: (params?: { page?: number; limit?: number; role?: string; tenantId?: string; storeId?: string }) =>
        api.get('/users', { params }),

    // Get user by ID
    getById: (id: string) =>
        api.get(`/users/${id}`),

    // Create user
    create: (data: UserCreateUpdate) =>
        api.post('/users', data),

    // Update user
    update: (id: string, data: Partial<UserCreateUpdate>) =>
        api.patch(`/users/${id}`, data),

    // Delete user
    delete: (id: string, storeId?: string) =>
        api.delete(`/users/${id}`, { params: storeId ? { storeId } : undefined }),

    // Update user status
    updateStatus: (id: string, status: 'active' | 'inactive') =>
        api.patch(`/users/${id}/status`, { status }),

    // Get users by store
    getByStore: (storeId: string, params?: { page?: number; limit?: number; role?: string }) =>
        api.get(`/users/store/${storeId}`, { params }),

    // Get current user profile
    getProfile: () =>
        api.get('/users/me'),

    // Update current user profile
    updateProfile: (data: Partial<UserCreateUpdate> & { currentPassword?: string }) =>
        api.patch('/users/me', data),
};
