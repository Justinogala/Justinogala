import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth(); // If needed for filtering user-specific notifications later

  const refreshNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(notificationService.getUnreadCount());
  };

  useEffect(() => {
    // Initial load
    refreshNotifications();

    // Subscribe to service events
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const markAsRead = (id) => notificationService.markAsRead(id);
  const markAllAsRead = () => notificationService.markAllAsRead();
  const deleteNotification = (id) => notificationService.deleteNotification(id);
  const clearAll = () => notificationService.clearAll();
  const toggleReadStatus = (id) => notificationService.toggleReadStatus(id);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      toggleReadStatus
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;