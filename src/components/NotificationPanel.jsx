import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    clearAll, 
    toggleReadStatus, 
    deleteNotification 
  } = useNotifications();

  if (!isOpen) return null;

  const handleSettingsClick = () => {
    onClose();
    navigate('/settings?tab=notifications');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen backdrop for mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" 
            onClick={onClose}
          />
          
          {/* Panel - Full screen on mobile, dropdown on desktop */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-0 bottom-0 z-50 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-96 origin-top-right"
          >
            <div className="h-full md:h-auto bg-white dark:bg-slate-900 md:rounded-xl shadow-2xl border-0 md:border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
              
              {/* Header - Sticky on mobile */}
              <div className="sticky top-0 z-10 p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 safe-area-top">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 md:hidden text-gray-500 -ml-2"
                      onClick={onClose}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-gray-500 hover:text-indigo-600 active:bg-indigo-50"
                      onClick={markAllAsRead}
                      title="Mark all as read"
                      disabled={notifications.length === 0}
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-gray-500 hover:text-red-600 active:bg-red-50"
                      onClick={clearAll}
                      title="Clear all"
                      disabled={notifications.length === 0}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-gray-500 hover:text-indigo-600 active:bg-indigo-50"
                      onClick={handleSettingsClick}
                      title="Notification Settings"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* List - Scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.map(notification => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification}
                        onMarkRead={toggleReadStatus}
                        onDelete={deleteNotification}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 px-6 text-center text-gray-500">
                    <div className="bg-gray-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-900 dark:text-white">No notifications yet</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                      We&apos;ll let you know when something important arrives.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Sticky at bottom on mobile */}
              <div className="sticky bottom-0 p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-11 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  onClick={handleSettingsClick}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Notification Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;