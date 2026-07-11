import { useState, useEffect, useCallback } from 'react';
import api from '@/services/admin/api';
import { Tenant } from '@/types';
import { ApiResponse } from '@/types/admin/api';

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Tenant[]>>('/tenants');
      const data = response.data.data;
      setTenants(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTenantStatus = async (tenantId: string, status: 'active' | 'suspended') => {
    try {
      await api.patch(`/tenants/${tenantId}/status`, { status });
      setTenants(prev => prev.map(t => t._id === tenantId ? { ...t, status } : t));
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  const createBillingRecord = async (tenantId: string, data: any) => {
    try {
      const response = await api.post(`/tenants/${tenantId}/billing-history`, data);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to create billing record' };
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return { tenants, loading, error, fetchTenants, updateTenantStatus, createBillingRecord };
}
