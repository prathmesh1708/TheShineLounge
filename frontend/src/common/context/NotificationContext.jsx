import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [userNotifications, setUserNotifications] = useState([]);
  const [staffNotifications, setStaffNotifications] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications for User App
  const fetchUserNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('tsl_token') || localStorage.getItem('tsl_customer_token');
      if (!token) return;
      const res = await apiClient.get('/notifications/user');
      if (res.data && res.data.notifications) {
        setUserNotifications(res.data.notifications);
      }
    } catch (err) {
      console.warn('Could not load user notifications:', err.message);
    }
  }, []);

  // Fetch notifications for Staff App
  const fetchStaffNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('tsl_token') || localStorage.getItem('tsl_admin_token');
      if (!token) return;
      const res = await apiClient.get('/notifications/staff');
      if (res.data && res.data.notifications) {
        setStaffNotifications(res.data.notifications);
      }
    } catch (err) {
      console.warn('Could not load staff notifications:', err.message);
    }
  }, []);

  // Fetch notifications for Admin Management
  const fetchAdminNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('tsl_token') || localStorage.getItem('tsl_admin_token');
      if (!token) return;
      const res = await apiClient.get('/notifications/admin');
      if (res.data && res.data.notifications) {
        setAdminNotifications(res.data.notifications);
      }
    } catch (err) {
      console.warn('Could not load admin notifications:', err.message);
    }
  }, []);

  // Initial fetch and poll every 10 seconds for real-time live sync
  useEffect(() => {
    fetchUserNotifications();
    fetchStaffNotifications();
    fetchAdminNotifications();

    const interval = setInterval(() => {
      fetchUserNotifications();
      fetchStaffNotifications();
      fetchAdminNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchUserNotifications, fetchStaffNotifications, fetchAdminNotifications]);

  // Admin Actions: Create Broadcast / Targeted Notification
  const createNotification = async (payload) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/notifications/admin', payload);
      if (res.data && res.data.success) {
        await fetchAdminNotifications();
        await fetchUserNotifications();
        await fetchStaffNotifications();
        return { success: true, message: 'Notification sent successfully!' };
      }
      return { success: false, message: res.data?.message || 'Failed to send notification' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Admin Actions: Edit Sent Notification
  const updateNotification = async (id, payload) => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/notifications/admin/${id}`, payload);
      if (res.data && res.data.success) {
        await fetchAdminNotifications();
        await fetchUserNotifications();
        await fetchStaffNotifications();
        return { success: true, message: 'Notification updated successfully!' };
      }
      return { success: false, message: res.data?.message || 'Failed to update notification' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Admin Actions: Delete Notification
  const deleteNotification = async (id) => {
    setLoading(true);
    try {
      const res = await apiClient.delete(`/notifications/admin/${id}`);
      if (res.data && res.data.success) {
        await fetchAdminNotifications();
        await fetchUserNotifications();
        await fetchStaffNotifications();
        return { success: true, message: 'Notification deleted successfully!' };
      }
      return { success: false, message: res.data?.message || 'Failed to delete notification' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Read status handlers
  const markAsRead = async (id) => {
    try {
      await apiClient.post(`/notifications/read/${id}`);
      setUserNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setStaffNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.warn('Could not mark notification read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      setUserNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setStaffNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Could not mark all notifications read:', err.message);
    }
  };

  const unreadUserCount = userNotifications.filter(n => !n.isRead).length;
  const unreadStaffCount = staffNotifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        userNotifications,
        staffNotifications,
        adminNotifications,
        unreadUserCount,
        unreadStaffCount,
        loading,
        fetchUserNotifications,
        fetchStaffNotifications,
        fetchAdminNotifications,
        createNotification,
        updateNotification,
        deleteNotification,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
