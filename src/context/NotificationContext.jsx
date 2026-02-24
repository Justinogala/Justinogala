import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

const NotificationContext = createContext(null);

// Demo notifications to show on first login
const DEMO_NOTIFICATIONS = [
  {
    type: 'system',
    title: 'Welcome to Munal! 👋',
    message: 'Start by recording your first video or exploring the chat feature.',
    icon: 'Sparkles',
    color: 'bg-indigo-500'
  },
  {
    type: 'transcription',
    title: 'Quick Record Ready',
    message: 'You can now record up to 30 minutes of screen or camera video.',
    icon: 'Video',
    color: 'bg-rose-500'
  }
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const refreshNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(notificationService.getUnreadCount());
  };

  // Create a new notification
  const createNotification = useCallback((data) => {
    const newNotification = notificationService.createNotification(data);
    refreshNotifications();
    return newNotification;
  }, []);

  // Add demo notifications for new users
  const addDemoNotifications = useCallback(() => {
    const hasSeenDemo = localStorage.getItem('munal_demo_notifications_shown');
    if (!hasSeenDemo && user) {
      DEMO_NOTIFICATIONS.forEach(notification => {
        notificationService.createNotification(notification);
      });
      localStorage.setItem('munal_demo_notifications_shown', 'true');
      refreshNotifications();
    }
  }, [user]);

  useEffect(() => {
    // Initial load
    refreshNotifications();
    
    // Add demo notifications for new users
    if (user) {
      addDemoNotifications();
    }

    // Subscribe to service events
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    });

    return () => {
      unsubscribe();
    };
  }, [user, addDemoNotifications]);

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
      toggleReadStatus,
      createNotification,
      refreshNotifications
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