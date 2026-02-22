
import React from 'react';
import { Phone, Video, PhoneMissed, PhoneOutgoing, Clock, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CallHistoryItem = ({ call }) => {
  const isMissed = call.status === 'missed' || call.status === 'declined';
  const isVideo = call.type === 'video';

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
      <div className={cn(
        "p-2 rounded-full mt-1",
        isMissed ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      )}>
        {isMissed ? <PhoneMissed className="w-4 h-4" /> : (isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className={cn("text-sm font-medium", isMissed ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white")}>
            {call.title || (isMissed ? 'Missed Call' : 'Outgoing Call')}
          </h4>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{formatTime(call.timestamp)}</span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          {!isMissed && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration)}
            </span>
          )}
          <span>{call.participants?.length || 2} Participants</span>
        </div>

        {call.isRecorded && (
          <div className="mt-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-dashed">
              <Download className="w-3 h-3" />
              Recording Available
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistoryItem;
