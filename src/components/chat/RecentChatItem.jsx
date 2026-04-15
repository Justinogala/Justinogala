
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Archive, MoreVertical, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import OnlineStatus from './OnlineStatus';
import UnreadBadge from './UnreadBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const RecentChatItem = ({ chat, isActive, onClick, onArchive, onDelete }) => {
  if (!chat || !chat.user) return null;

  const { user, lastMessage, unreadCount } = chat;
  const isUnread = unreadCount > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border",
        isActive
          ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
          : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md"
      )}
      onClick={onClick}
    >
      {/* Avatar Section */}
      <div className="relative flex-shrink-0">
        <UserAvatar 
          name={user.name} 
          email={user.email} 
          colorClass={user.avatarColor}
          avatarUrl={user.avatar}
          className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm"
        />
        <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-slate-800 rounded-full p-0.5">
          <OnlineStatus isOnline={user.online} className="" />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "text-sm font-semibold truncate",
              isUnread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"
            )}>
              {user.name}
            </h4>
          </div>
          <span className={cn(
            "text-xs whitespace-nowrap ml-2",
            isUnread ? "text-violet-600 font-medium" : "text-gray-400"
          )}>
            {lastMessage?.timestamp}
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          <p className={cn(
            "text-sm truncate max-w-[85%]",
            isUnread 
              ? "text-gray-800 dark:text-gray-100 font-medium" 
              : "text-gray-500 dark:text-gray-400"
          )}>
            {lastMessage?.sender === 'me' && <span className="text-violet-500 dark:text-violet-400 mr-1">You:</span>}
            {lastMessage?.content || "Start a conversation..."}
          </p>
          <UnreadBadge count={unreadCount} />
        </div>

        {/* Email hint on hover only */}
        <div className="hidden group-hover:flex items-center gap-1 mt-1 text-xs text-gray-400 transition-opacity">
           <Mail className="w-3 h-3" />
           {user.email}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(chat.id); }}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
              onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default RecentChatItem;
