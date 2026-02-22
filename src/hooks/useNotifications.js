
import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    };
    load();
    const interval = setInterval(load, 15000); // Poll less frequently
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount };
};
