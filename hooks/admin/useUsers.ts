import { useState, useCallback, useEffect } from 'react';
import api from '@/services/admin/api';
import { User } from '@/types';
import { ApiResponse } from '@/types/admin/api';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1, limit = 50, search = '') => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<User[]>>(`/users`, { params: { page, limit, search } });
      setUsers(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Delete failed' };
    }
  };

  const createUser = async (userData: any) => {
    try {
      const response = await api.post<ApiResponse<User>>(`/users`, userData);
      setUsers(prev => [response.data.data, ...prev]);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.response?.data?.error?.message || 'Create failed' };
    }
  };

  const updateUser = async (id: string, userData: any) => {
    try {
      const response = await api.patch<ApiResponse<User>>(`/users/${id}`, userData);
      setUsers(prev => prev.map(u => (u._id === id || u.id === id) ? response.data.data : u));
      return { success: true, data: response.data.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.response?.data?.error?.message || 'Update failed' };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, fetchUsers, deleteUser, createUser, updateUser };
}
