import api from '../axios';

export interface LoginCredentials {
    email: string;
    password: string;
    tenantId?: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    role: string;
    tenantId?: string;
}

export const authApi = {
    login: (token: string) => api.post('/auth/login', {}, { headers: { Authorization: `Bearer ${token}` } }),
    googleLogin: (token: string) => api.post('/auth/google', {}, { headers: { Authorization: `Bearer ${token}` } }),

    register: (data: RegisterData) => api.post('/auth/register', data),

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('storeId');
            localStorage.removeItem('storeDetails');
            localStorage.removeItem('tenantDetails');
            // Clear cookies
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
    },

    getUser: () => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    },

    refreshToken: (data: { refreshToken: string }) => api.post('/auth/refresh-token', data),
};
