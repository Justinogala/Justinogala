
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Edit2, Trash2, Eye, CalendarX, Loader2, Users, MoreHorizontal, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { meetingService } from '@/services/meetingService';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MeetingListSection = ({ refreshTrigger }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const data = await Promise.resolve(meetingService.getMeetings());
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      setMeetings(sorted);
    } catch (error) {
      console.error("Failed to fetch meetings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [refreshTrigger]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      try {
        meetingService.deleteMeeting(id);
        toast({ title: "Meeting deleted", description: "The meeting has been cancelled." });
        fetchMeetings();
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete meeting.", variant: "destructive" });
      }
    }
  };

  const getBadgeVariant = (type) => {
    const safeType = (type || 'general').toLowerCase();
    switch (safeType) {
      case 'internal': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case 'client': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900';
      case 'team': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-500" />
            Upcoming Meetings
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your schedule for the next few days</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-full px-4">
          View All
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/20">
            <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-full mb-3">
              <CalendarX className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No meetings scheduled</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">
              You're all clear! Click "New Meeting" to schedule one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {meetings.slice(0, 5).map((meeting, index) => (
                <motion.div 
                  key={meeting.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/80 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                >
                  <div className="flex-1 min-w-0 flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 w-14 h-14 shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                      <span className="text-xs font-semibold uppercase">{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-xl font-bold leading-none mt-0.5">{new Date(meeting.date).getDate()}</span>
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                          {meeting.title}
                        </h4>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 border ${getBadgeVariant(meeting.type)}`}>
                          {meeting.type || 'General'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{meeting.time}</span>
                        </div>
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>{meeting.attendees.length} Attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0 bg-white/90 dark:bg-slate-800/90 sm:bg-transparent sm:dark:bg-transparent rounded-full sm:rounded-none p-1 sm:p-0 shadow-sm sm:shadow-none">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full" onClick={(e) => handleDelete(meeting.id, e)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-full">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingListSection;
