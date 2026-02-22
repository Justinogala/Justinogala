import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import OnlineStatus from './OnlineStatus';

const UserListSidebar = ({ users, selectedUserId, onSelectUser }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 w-80 flex-shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Messages</h2>
        <p className="text-xs text-slate-500">Select a user to start chatting</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left relative group",
                selectedUserId === user.id 
                  ? "bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                  : "hover:bg-white/60 dark:hover:bg-slate-800/60"
              )}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-900 shadow-sm">
                  <AvatarFallback className={cn("text-white font-medium text-xs", user.avatarColor)}>
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5">
                  <OnlineStatus status={user.status} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className={cn(
                    "font-medium text-sm truncate",
                    selectedUserId === user.id ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"
                  )}>
                    {user.name}
                  </span>
                  {user.status === 'online' && (
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full font-medium">
                      Online
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              
              {selectedUserId === user.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-violet-600 rounded-r-full" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserListSidebar;