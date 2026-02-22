import React from 'react';
import { Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo, formatMeetingTime } from '@/utils/meetingUtils';
import { motion } from 'framer-motion';

const MeetingListItem = ({ meeting, isSelected, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(meeting)}
      className={cn(
        "p-4 rounded-xl cursor-pointer transition-all duration-200 border relative group overflow-hidden mb-3",
        isSelected 
          ? "bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800 shadow-md ring-1 ring-violet-500/20" 
          : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-lg hover:shadow-violet-500/5"
      )}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600 rounded-l-xl" />
      )}
      
      <div className="flex justify-between items-start mb-2 pl-2">
        <h3 className={cn(
          "font-bold text-base truncate pr-2 flex-1",
          isSelected ? "text-violet-900 dark:text-violet-100" : "text-gray-900 dark:text-gray-100"
        )}>
          {meeting.title || "Untitled Meeting"}
        </h3>
        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-slate-900 px-2 py-1 rounded-full border border-gray-100 dark:border-slate-800">
          {formatTimeAgo(meeting.createdAt)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 pl-2 mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-violet-500" />
          <span>{meeting.date || 'No date set'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3.5 h-3.5 text-violet-500" />
          <span>{formatMeetingTime(meeting.date, meeting.time)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pl-2 mt-3 pt-3 border-t border-gray-50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span>{meeting.participants?.length || 0} Participants</span>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 text-gray-300 transition-transform duration-200",
          isSelected ? "text-violet-500 translate-x-1" : "group-hover:translate-x-1 group-hover:text-violet-400"
        )} />
      </div>
    </motion.div>
  );
};

export default MeetingListItem;