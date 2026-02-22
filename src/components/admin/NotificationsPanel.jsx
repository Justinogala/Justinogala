
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, X, Settings, Trash2, 
  UserPlus, AlertTriangle, FileText, DollarSign, Layout 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications } from '@/services/adminService';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const getIcon = (type) => {
  switch (type) {
    case 'user': return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'system': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'report': return <FileText className="h-4 w-4 text-green-500" />;
    case 'billing': return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case 'workspace': return <Layout className="h-4 w-4 text-purple-500" />;
    default: return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await getAdminNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Poll every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-16 z-50 w-full max-w-sm sm:w-[380px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {notifications.filter(n => !n.read).length}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark all as read" onClick={handleMarkAllRead}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Clear all" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[350px]">
        {loading ? (
          <div className="flex justify-center items-center h-full text-sm text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                onClick={() => handleMarkRead(n.id)}
              >
                <div className="flex gap-3 items-start">
                  <div className={`mt-1 p-1.5 rounded-full ${!n.read ? 'bg-white shadow-sm dark:bg-slate-800' : 'bg-gray-100 dark:bg-slate-800'}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900">
        <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 h-8">
          <Settings className="w-3 h-3 mr-2" />
          Notification Settings
        </Button>
      </div>
    </motion.div>
  );
};

export default NotificationsPanel;
