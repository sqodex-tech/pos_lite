import { useState, useEffect, useCallback } from 'react';
import api from '@/services/admin/api';
import { ApiResponse, AnalyticsDashboard } from '@/types/admin/api';

export function useDashboard() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (period = '30') => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<AnalyticsDashboard>>(`/analytics/dashboard?period=${period}`);
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, fetchDashboard };
}
