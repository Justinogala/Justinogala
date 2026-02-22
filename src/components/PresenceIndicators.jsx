
import React, { useState, useEffect } from 'react';
import { presenceService } from '@/services/presenceService';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e'];

const PresenceIndicators = ({ transcriptId }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!transcriptId || !user) return;

    // Join presence channel with a random color assigned for this session
    const myColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const unsubscribe = presenceService.join(transcriptId, {
      id: user.id,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      color: myColor
    });

    const handleUpdate = (e) => {
      setUsers(e.detail);
    };

    window.addEventListener(`presence-update-${transcriptId}`, handleUpdate);

    // Initial state
    setUsers(presenceService.getActiveUsers());

    return () => {
      unsubscribe();
      presenceService.leave();
      window.removeEventListener(`presence-update-${transcriptId}`, handleUpdate);
    };
  }, [transcriptId, user]);

  return (
    <div className="flex items-center -space-x-2">
      <TooltipProvider>
        {users.map((u) => (
          <Tooltip key={u.id}>
            <TooltipTrigger asChild>
              <div className="relative group transition-transform hover:-translate-y-1 hover:z-10 cursor-pointer">
                <Avatar className="w-8 h-8 border-2 border-background ring-2 ring-offset-1 ring-offset-background" style={{ ringColor: u.color }}>
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: u.color + '20', color: u.color }}>
                    {u.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Active Status Dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{u.full_name} {u.id === user?.id && '(You)'}</p>
              <p className="text-xs text-muted-foreground">Active now</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
      
      {users.length === 0 && (
         <span className="text-xs text-muted-foreground ml-3">No one else is here</span>
      )}
    </div>
  );
};

export default PresenceIndicators;
