import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sumbox_admin_token');
      if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s uniquely for Refresh Tokens
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
        // Attempt refresh if 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/admin-login') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('sumbox_admin_refresh');
        if (!refreshToken) throw new Error('No refresh token');

        // Note: Do not use the `api` instance to fetch refresh token to prevent loop
        const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh-token`, { refreshToken });
        
        const { accessToken } = refreshResponse.data.data;
        localStorage.setItem('sumbox_admin_token', accessToken);
        
        // Update original request headers and retry
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sumbox_admin_token');
          localStorage.removeItem('sumbox_admin_refresh');
          localStorage.removeItem('sumbox_admin_user');
          window.location.href = '/admin/login';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
