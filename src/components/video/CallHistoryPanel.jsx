import React from 'react';
import { format } from 'date-fns';
import { Phone, Video, Trash2, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CallHistoryPanel = ({ history, onClearHistory }) => {
  const formatDuration = (secs) => {
    if (!secs) return '0s';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-80 lg:w-96">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-bold text-slate-900 dark:text-white">Call History</h2>
        {history.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearHistory}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-8"
          >
            <Trash2 className="w-3 h-3 mr-1.5" /> Clear
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-8 text-center">
            <Clock className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No recent calls</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
             {history.map((log) => (
               <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                 <div className="flex items-center justify-between mb-1">
                   <span className="font-medium text-slate-900 dark:text-white text-sm">
                     {log.user.name}
                   </span>
                   <span className="text-[10px] text-slate-400">
                     {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                   </span>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-1.5">
                     {log.status === 'missed' ? (
                       <ArrowDownLeft className="w-3 h-3 text-red-500" />
                     ) : (
                       <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                     )}
                     <span className={cn(
                       "text-xs capitalize",
                       log.status === 'missed' ? "text-red-500" : "text-slate-600 dark:text-slate-400"
                     )}>
                       {log.status === 'missed' ? 'Missed Call' : formatDuration(log.duration)}
                     </span>
                   </div>
                   
                   <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded">
                     {log.type === 'video' ? (
                       <Video className="w-3 h-3 text-slate-500" />
                     ) : (
                       <Phone className="w-3 h-3 text-slate-500" />
                     )}
                   </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default CallHistoryPanel;