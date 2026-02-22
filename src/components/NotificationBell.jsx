import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(
          "relative transition-colors duration-200",
          isOpen ? "bg-gray-100 dark:bg-slate-800 text-indigo-600" : "text-gray-600 dark:text-gray-300",
          unreadCount > 0 && "hover:text-indigo-600"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-pulse-slow")} />
        
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900 notification-badge-pulse"></span>
          </span>
        )}
      </Button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

export default NotificationBell;