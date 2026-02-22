
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Calendar, Trash2, FileText, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const HistoryItem = ({ item, onDelete, onClick }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={() => onClick(item)}>
          <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800">
            <AvatarImage src={item.userAvatar} />
            <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              {item.userName?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                {item.userName || 'Unknown User'}
              </h4>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                {formatDuration(item.duration)}
              </Badge>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
              {item.transcript || "No transcript available"}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(item.timestamp), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(item.timestamp), 'h:mm a')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClick(item)}
            className="h-8 w-8 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryItem;
