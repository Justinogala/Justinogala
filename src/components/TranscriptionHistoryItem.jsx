import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { FileText, Clock, Trash2, Eye, Download, MoreHorizontal, Sparkles, CheckSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import TranscriptionStatusBadge from '@/components/TranscriptionStatusBadge';

const TranscriptionHistoryItem = ({ item, onView, onDelete, onDownload }) => {
  const insightCount = item.insights?.keyPoints?.length || 0;
  const actionItemCount = item.actionItems?.length || 0;

  // Safe date formatting
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown Date';
      const date = new Date(dateString);
      return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const formatFileSize = (size) => {
    if (!size) return '0 B';
    // If it's already a string with unit (e.g. "1.2 MB"), return it
    if (typeof size === 'string' && size.includes('B')) return size;
    // If number, format it
    if (typeof size === 'number') return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return size;
  };

  const formatDuration = (duration) => {
    if (!duration) return '0:00';
    // If it's already formatted (e.g. "2:30"), return it
    if (typeof duration === 'string' && duration.includes(':')) return duration;
    // If it's seconds, format it
    const seconds = parseInt(duration);
    if (!isNaN(seconds)) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return duration;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      layout
      className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-100 dark:hover:border-indigo-900"
    >
      <div className="flex items-start gap-4 mb-4 md:mb-0 w-full md:w-auto">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 shrink-0">
          <FileText className="w-6 h-6" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h4 
            className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-[400px] cursor-pointer hover:text-indigo-600"
            title={item.fileName || item.title}
            onClick={() => onView(item)}
          >
            {item.title || item.fileName || 'Untitled Transcription'}
          </h4>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1.5" title="Upload Date">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(item.uploadDate)}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="flex items-center gap-1.5" title="Duration">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(item.duration)}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
             <span title="File Size">{formatFileSize(item.fileSize)}</span>
          </div>

          {(insightCount > 0 || actionItemCount > 0) && (
             <div className="flex gap-3 mt-2">
                {insightCount > 0 && (
                   <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-100 flex gap-1">
                      <Sparkles className="w-3 h-3" /> {insightCount} Insights
                   </Badge>
                )}
                {actionItemCount > 0 && (
                   <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-100 flex gap-1">
                      <CheckSquare className="w-3 h-3" /> {actionItemCount} Actions
                   </Badge>
                )}
             </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-0 md:pl-4">
        <TranscriptionStatusBadge status={item.status} />
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onView(item)} className="hidden md:flex">
            View
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(item)}>
                <Eye className="w-4 h-4 mr-2" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDownload(item)}
                disabled={!item.transcribedText}
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(item.id)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

export default TranscriptionHistoryItem;