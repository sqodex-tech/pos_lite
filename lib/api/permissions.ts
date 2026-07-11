import api from '../axios';

export interface UserPermissions {
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    permissions: string[];
    rolePermissions: string[];
    customPermissions: string[];
    permissionOverrides: {
        granted: string[];
        revoked: string[];
    };
}

export const permissionsApi = {
    // New RBAC store-scoped endpoints
    getMatrix: (storeId: string) =>
        api.get('/permissions/matrix', { params: { storeId } }),

    getRolePermissions: (role: string, storeId: string) =>
        api.get(`/permissions/roles/${role}`, { params: { storeId } }),

    setModuleActions: (role: string, module: string, storeId: string, data: any) =>
        api.patch(`/permissions/roles/${role}/modules/${module}`, data, { params: { storeId } }),

    grantAction: (role: string, module: string, storeId: string, data: { action: string }) =>
        api.post(`/permissions/roles/${role}/modules/${module}/grant`, data, { params: { storeId } }),

    revokeAction: (role: string, module: string, storeId: string, data: { action: string }) =>
        api.post(`/permissions/roles/${role}/modules/${module}/revoke`, data, { params: { storeId } }),

    resetRoleDefaults: (role: string, storeId: string) =>
        api.post(`/permissions/roles/${role}/reset`, {}, { params: { storeId } }),

    getAuditLog: (storeId: string, params?: any) =>
        api.get('/permissions/audit', { params: { ...params, storeId } }),

    // Legacy user-based endpoints (for backwards compatibility)
    getAll: () =>
        api.get('/permissions'),

    getUserPermissions: (userId: string) =>
        api.get(`/permissions/user/${userId}`),

    updateUserPermissions: (userId: string, data: any) =>
        api.patch(`/permissions/user/${userId}`, data),

    resetUserPermissions: (userId: string) =>
        api.post(`/permissions/user/${userId}/reset`),

    bulkUpdate: (data: any) =>
        api.post('/permissions/bulk-update', data),
};
