import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, 
  CreditCard, 
  AlertCircle, 
  User, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Circle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const getIcon = () => {
    switch (notification.type) {
      case 'transcription': return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'billing': return <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'system': return <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      case 'account': return <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'plan_limit': return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'transcription': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'billing': return 'bg-orange-100 dark:bg-orange-900/30';
      case 'system': return 'bg-gray-100 dark:bg-gray-800';
      case 'account': return 'bg-purple-100 dark:bg-purple-900/30';
      case 'plan_limit': return 'bg-red-100 dark:bg-red-900/30';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  // Touch-friendly: long press to show actions on mobile
  const handleTouchStart = () => {
    const timer = setTimeout(() => setShowActions(true), 500);
    return () => clearTimeout(timer);
  };

  return (
    <div 
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={() => {}}
      className={cn(
        "group relative flex items-start gap-3 p-4 cursor-pointer transition-colors active:bg-gray-50 dark:active:bg-slate-800",
        !notification.read ? "bg-indigo-50/50 dark:bg-indigo-950/20" : "bg-white dark:bg-slate-900"
      )}
      data-testid={`notification-item-${notification.id}`}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r" />
      )}
      
      {/* Icon */}
      <div className={cn("mt-0.5 p-2.5 rounded-full shrink-0", getBgColor())}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className={cn(
          "text-sm font-medium leading-tight",
          !notification.read ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
        )}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </p>
      </div>

      {/* Action buttons - Always visible on mobile, hover on desktop */}
      <div className={cn(
        "flex flex-col gap-1 shrink-0 transition-opacity",
        "md:opacity-0 md:group-hover:opacity-100",
        showActions && "opacity-100"
      )}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-gray-400 hover:text-indigo-600 active:bg-indigo-50"
          onClick={(e) => handleAction(e, () => onMarkRead(notification.id))}
          title={notification.read ? "Mark unread" : "Mark read"}
        >
          {notification.read ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-gray-400 hover:text-red-600 active:bg-red-50"
          onClick={(e) => handleAction(e, () => onDelete(notification.id))}
          title="Delete"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Arrow indicator if there's an action URL */}
      {notification.actionUrl && (
        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 self-center hidden md:block" />
      )}
    </div>
  );
};

export default NotificationItem;