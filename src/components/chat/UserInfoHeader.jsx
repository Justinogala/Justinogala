
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import OnlineStatus from './OnlineStatus';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UserInfoHeader = ({ user, isOnline }) => {
  if (!user) return null;

  // Use passed isOnline prop or fallback to user.status
  const userIsOnline = isOnline !== undefined ? isOnline : user.status === 'online';

  return (
    <div className="h-16 px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-slate-900">
            <AvatarFallback className={`${user.avatarColor || 'bg-slate-200'} text-white font-medium text-xs`}>
              {user.initials || user.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5">
            <OnlineStatus status={userIsOnline ? 'online' : 'offline'} className="h-2.5 w-2.5" />
          </div>
        </div>
        
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {user.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </span>
            {userIsOnline && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-[10px] text-emerald-600 font-medium">Active now</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default UserInfoHeader;
