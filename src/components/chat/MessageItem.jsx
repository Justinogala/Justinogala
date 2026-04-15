
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import RoleBadge from '@/components/admin/RoleBadge';

const MessageItem = ({ message, onMarkRead }) => {
  const isUnread = !message.isRead;

  return (
    <div className={cn(
      "group relative flex gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
      isUnread 
        ? "bg-white dark:bg-slate-800 border-violet-200 dark:border-violet-900 shadow-sm" 
        : "bg-gray-50/50 dark:bg-slate-900/50 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-700"
    )}>
      {/* Unread Indicator */}
      {isUnread && (
        <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-violet-600 ring-2 ring-white dark:ring-slate-900" />
      )}

      <div className="flex-shrink-0">
        <UserAvatar 
          name={message.senderName} 
          email={message.senderEmail} 
          colorClass={message.avatarColor}
          avatarUrl={message.senderAvatar}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn(
              "text-sm font-semibold truncate",
              isUnread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"
            )}>
              {message.senderName}
            </h4>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {message.senderEmail}
            </span>
            <div className="scale-75 origin-left">
              <RoleBadge role={message.role} />
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        </div>

        <p className={cn(
          "text-sm leading-relaxed break-words",
          isUnread ? "text-gray-800 dark:text-gray-100 font-medium" : "text-gray-600 dark:text-gray-400"
        )}>
          {message.content}
        </p>
      </div>

      {isUnread && onMarkRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(message.id);
          }}
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-900"
          title="Mark as read"
        >
          <CheckCheck className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MessageItem;
