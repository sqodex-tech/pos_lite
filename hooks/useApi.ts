import { useState, useEffect } from 'react';
import { handleApiError } from '@/lib/errorHandler';

interface UseApiOptions<T> {
    initialData?: T;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    autoFetch?: boolean;
}

export function useApi<T>(
    apiFunction: () => Promise<any>,
    options: UseApiOptions<T> = {}
) {
    const {
        initialData = null as T,
        onSuccess,
        onError,
        autoFetch = true
    } = options;

    const [data, setData] = useState<T>(initialData);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiFunction();
            const result = response.data.data || response.data;
            setData(result);
            onSuccess?.(result);
            return result;
        } catch (err: any) {
            const errorInfo = handleApiError(err, 'API Request');
            setError(errorInfo);
            onError?.(errorInfo);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        setData
    };
}

export function useMutation<T, P = any>(
    apiFunction: (params: P) => Promise<any>,
    options: {
        onSuccess?: (data: T) => void;
        onError?: (error: any) => void;
    } = {}
) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const mutate = async (params: P) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiFunction(params);
            const result = response.data.data || response.data;
            options.onSuccess?.(result);
            return result;
        } catch (err: any) {
            const errorInfo = handleApiError(err, 'Mutation');
            setError(errorInfo);
            options.onError?.(errorInfo);
            throw errorInfo;
        } finally {
            setLoading(false);
        }
    };

    return {
        mutate,
        loading,
        error
    };
}
