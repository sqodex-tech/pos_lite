import { useState, useCallback, useEffect } from 'react';
import api from '@/services/admin/api';
import { ApiResponse, BillingDashboard } from '@/types/admin/api';

export function useBilling() {
  const [data, setData] = useState<BillingDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (period = '30d') => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<BillingDashboard>>(`/billing/dashboard?period=${period}`);
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  const processRecurring = async () => {
    try {
      await api.post('/billing/process-recurring');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Recurring process failed' };
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, fetchDashboard, processRecurring };
}
