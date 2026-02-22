
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Phone, Video, Clock, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { callHistoryService } from '@/services/callHistoryService';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CallHistoryPanel = ({ onClose }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const data = callHistoryService.getCallHistory();
    setHistory(data);
  };

  const handleDelete = (id) => {
    callHistoryService.deleteCallLog(id);
    loadHistory();
  };

  return (
    <div className="w-80 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-white">Call History</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {history.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-slate-400">
             <Clock className="w-12 h-12 mb-3 opacity-20" />
             <p className="text-sm">No call history yet</p>
           </div>
        ) : (
          <div className="p-2 space-y-2">
            {history.map((log) => (
              <div 
                key={log.id} 
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                     <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700">
                       {log.participants?.[0]?.name?.[0] || 'U'}
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                       {log.participants?.[0]?.name || 'User'}
                     </p>
                     <div className="flex items-center gap-1.5 text-xs text-slate-500">
                       {log.type === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                       <span>•</span>
                       <span>{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                     </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pl-11">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                    log.status === 'completed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    log.status === 'missed' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {log.status === 'missed' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {log.status === 'completed' ? callHistoryService.formatDuration(log.duration) : log.status}
                  </span>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Log</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Quick fix for missing X icon import
import { X } from 'lucide-react';

export default CallHistoryPanel;
