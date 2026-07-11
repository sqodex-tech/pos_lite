import { useState, useCallback, useEffect } from 'react';
import api from '@/services/admin/api';
import { Subscription } from '@/types';
import { ApiResponse, SubscriptionStats } from '@/types/admin/api';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);

  const fetchSubscriptions = useCallback(async (filters: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', ...filters }).toString();
      const [subsRes, statsRes] = await Promise.all([
        api.get<ApiResponse<Subscription[]>>(`/subscriptions?${params}`),
        api.get<ApiResponse<SubscriptionStats>>('/subscriptions/stats')
      ]);
      setSubscriptions(subsRes.data.data || []);
      setStats(statsRes.data.data || null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveSubscription = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/approve`);
      fetchSubscriptions();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Approval failed' };
    }
  };

  const cancelSubscription = async (id: string, immediately = true) => {
    try {
      await api.post(`/subscriptions/${id}/cancel`, { immediately });
      fetchSubscriptions();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Cancel failed' };
    }
  };

  const renewSubscription = async (id: string) => {
    try {
      await api.post(`/subscriptions/${id}/renew`);
      fetchSubscriptions();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Renewal failed' };
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return { subscriptions, loading, error, stats, fetchSubscriptions, approveSubscription, cancelSubscription, renewSubscription };
}
