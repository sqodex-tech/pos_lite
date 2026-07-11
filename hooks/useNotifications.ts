import { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin/api';
import storeApi from '@/lib/axios';
import toast from 'react-hot-toast';

const getApi = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return adminApi;
  }
  return storeApi;
};

export interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApi().get('/notifications');
      setNotifications(res.data?.data || []);
      
      const countRes = await getApi().get('/notifications/unread-count');
      setUnreadCount(countRes.data?.data?.count || 0);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await getApi().patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await getApi().patch('/notifications/read-all');
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err: any) {
      toast.error('Failed to mark all as read');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
