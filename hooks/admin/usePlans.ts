import { useState, useCallback, useEffect } from 'react';
import api from '@/services/admin/api';
import { Plan } from '@/types';
import { ApiResponse } from '@/types/admin/api';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Plan[]>>('/tenants/plans');
      setPlans(response.data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = async (planData: Partial<Plan>) => {
    try {
      await api.post('/tenants/plans', planData);
      fetchPlans();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Create failed' };
    }
  };

  const updatePlan = async (id: string, planData: Partial<Plan>) => {
    try {
      await api.patch(`/tenants/plans/${id}`, planData);
      fetchPlans();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await api.delete(`/tenants/plans/${id}`);
      setPlans(prev => prev.filter(p => p._id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Delete failed' };
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, fetchPlans, createPlan, updatePlan, deletePlan };
}
