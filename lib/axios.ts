import axios from 'axios';
import toast from 'react-hot-toast';
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Globally attach the active store context for backend RBAC middleware
        const storeId = localStorage.getItem('storeId');
        if (storeId) {
            config.headers['x-store-id'] = storeId;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Normalize backend ApiError structure for frontend
        if (error.response?.data?.error?.message) {
            if (!error.response.data.message) {
                error.response.data.message = error.response.data.error.message;
            }
        }

        const message = error.response?.data?.message || '';

        // If it's a limit or subscription error, ensure it clearly tells them to upgrade
        if (
            (message.includes('Limit Reached') || message.includes('No Active Subscription')) &&
            !message.toLowerCase().includes('upgrade')
        ) {
            error.response.data.message = message + " - Please upgrade your plan to continue.";
        }

        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
