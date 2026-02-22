import React from 'react';
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
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'transcription': return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'billing': return <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'system': return <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'account': return <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'plan_limit': return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
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

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "group relative flex items-start gap-3 p-4 cursor-pointer notification-item border-b border-gray-100 dark:border-gray-800 last:border-0",
        !notification.read ? "bg-indigo-50/40 dark:bg-indigo-950/10" : "bg-white dark:bg-slate-900"
      )}
    >
      {!notification.read && <div className="notification-unread-indicator bg-indigo-500" />}
      
      <div className={cn("mt-1 p-2 rounded-full shrink-0", getBgColor())}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className={cn("text-sm font-medium leading-none", !notification.read ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400")}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-gray-400">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </p>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-gray-400 hover:text-indigo-600"
          onClick={(e) => handleAction(e, () => onMarkRead(notification.id))}
          title={notification.read ? "Mark unread" : "Mark read"}
        >
          {notification.read ? <Circle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-gray-400 hover:text-red-600"
          onClick={(e) => handleAction(e, () => onDelete(notification.id))}
          title="Delete"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default NotificationItem;