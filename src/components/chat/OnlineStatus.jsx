
import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const OnlineStatus = ({ status = 'offline', className }) => {
  const isOnline = status === 'online';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("relative flex h-3 w-3", className)}>
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-3 w-3 border-2 border-white dark:border-slate-900",
              isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
            )}></span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOnline ? 'Online' : 'Offline'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OnlineStatus;
