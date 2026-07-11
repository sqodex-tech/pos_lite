import toast from 'react-hot-toast';

export interface ApiError {
    code?: string;
    message?: string;
    response?: {
        status?: number;
        data?: {
            message?: string;
        };
    };
}

export const handleApiError = (error: ApiError, context: string = 'Operation') => {
    console.error(`${context} error:`, error);

    // Network errors (backend not running)
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        toast.error('Cannot connect to backend. Please ensure the backend server is running on port 5001.');
        return {
            isNetworkError: true,
            message: 'Backend not connected'
        };
    }

    // Authentication errors
    if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }, 1500);
        return {
            isAuthError: true,
            message: 'Authentication failed'
        };
    }

    // Permission errors
    if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
        return {
            isPermissionError: true,
            message: 'Permission denied'
        };
    }

    // Not found errors
    if (error.response?.status === 404) {
        toast.error('Resource not found.');
        return {
            isNotFoundError: true,
            message: 'Not found'
        };
    }

    // Validation errors
    if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Invalid data provided.';
        toast.error(message);
        return {
            isValidationError: true,
            message
        };
    }

    // Server errors
    if (error.response?.status && error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
        return {
            isServerError: true,
            message: 'Server error'
        };
    }

    // Generic error
    const message = error.response?.data?.message || error.message || `${context} failed`;
    toast.error(message);
    return {
        isGenericError: true,
        message
    };
};

export const isBackendConnected = async (): Promise<boolean> => {
    try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/tenants/plans', {
            method: 'HEAD',
            mode: 'no-cors'
        });
        return true;
    } catch (error) {
        return false;
    }
};
