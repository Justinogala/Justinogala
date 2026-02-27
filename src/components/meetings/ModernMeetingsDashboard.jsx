
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Components
import MeetingsList from './MeetingsList';
import MeetingSchedulerModal from './MeetingSchedulerModal';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const ModernMeetingsDashboard = ({ onJoinClick }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [meetings, setMeetings] = useState([]);
  const [calendarMeetings, setCalendarMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
    loadCalendarMeetings();
  }, [user?.id]);

  const loadMeetings = () => {
    setLoading(true);
    try {
      // The service will automatically filter out the blacklisted meeting ID (3389bec5)
      const data = localMeetingsStorageService.getAllMeetings();
      setMeetings(data);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      toast({
        title: "Error",
        description: "Failed to load meetings list.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load calendar meetings from MongoDB
  const loadCalendarMeetings = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/calendar/events?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only show meetings with video calls
        const videoMeetings = (data.events || [])
          .filter(e => e.video_call || e.category === 'meeting')
          .map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            scheduledTime: e.start_time,
            endTime: e.end_time,
            status: new Date(e.start_time) > new Date() ? 'upcoming' : 'completed',
            meetingUrl: e.video_call_link,
            hasVideo: e.video_call,
            attendees: e.invitees?.map(inv => inv.name || inv.email) || [],
            isCalendarEvent: true,
            color: e.color
          }));
        setCalendarMeetings(videoMeetings);
      }
    } catch (error) {
      console.error("Failed to load calendar meetings:", error);
    }
  };

  const handleOpenScheduler = () => {
    setEditingMeeting(null);
    setIsSchedulerOpen(true);
  };

  const handleEditMeeting = (id) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      setEditingMeeting(meeting);
      setIsSchedulerOpen(true);
    }
  };

  const handleDeleteClick = (id) => {
    setMeetingToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!meetingToDelete) return;
    
    const result = await localMeetingsStorageService.deleteMeeting(meetingToDelete);
    if (result.success) {
      toast({
        title: "Meeting Deleted",
        description: "The meeting has been permanently removed.",
      });
      loadMeetings(); // Refresh list to reflect removal
    } else {
      toast({
        title: "Error",
        description: "Failed to delete meeting. Please try again.",
        variant: "destructive"
      });
    }
    setDeleteConfirmOpen(false);
    setMeetingToDelete(null);
  };

  const handleScheduleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (editingMeeting) {
        result = await localMeetingsStorageService.updateMeeting(editingMeeting.id, formData);
      } else {
        result = await localMeetingsStorageService.createMeeting(formData);
      }

      if (result.success) {
        toast({
          title: editingMeeting ? "Meeting Updated" : "Meeting Scheduled Successfully!",
          description: `Meeting '${formData.title}' has been ${editingMeeting ? 'updated' : 'scheduled'} for ${formData.date} at ${formData.time}.`,
          className: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200"
        });
        
        loadMeetings();
        setTimeout(() => {
          setIsSchedulerOpen(false);
          setEditingMeeting(null);
        }, 1000); 
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save meeting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived state for dashboard widgets
  const upcomingMeetings = meetings
    .filter(m => new Date(`${m.date}T${m.time}`) > new Date())
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Meetings Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your schedule and join active sessions.
          </p>
        </div>
        <div>
          <Button 
            onClick={handleOpenScheduler}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Meetings List Component */}
          <div className="bg-white dark:bg-slate-950/50 rounded-xl">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your Meetings</h2>
             </div>
             <MeetingsList 
               meetings={meetings}
               loading={loading}
               onView={(id) => onJoinClick && onJoinClick(id)}
               onEdit={handleEditMeeting}
               onDelete={handleDeleteClick}
               onCreateNew={handleOpenScheduler}
             />
          </div>
        </div>

        {/* Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Upcoming Widget */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <CardContent className="p-6 relative z-10">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Next Up
              </h3>
              
              {upcomingMeetings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMeetings.map(meeting => (
                    <div key={meeting.id} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => onJoinClick(meeting.id)}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm line-clamp-1">{meeting.title}</span>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-[10px] h-5">
                          {meeting.time}
                        </Badge>
                      </div>
                      <p className="text-xs text-violet-100 opacity-80">
                        {format(new Date(meeting.date), 'MMM d')} • {meeting.type || 'Video Call'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-violet-100/80 text-sm">
                  No upcoming meetings scheduled.
                </div>
              )}
              
              <Button 
                onClick={handleOpenScheduler}
                variant="secondary" 
                className="w-full mt-4 bg-white text-violet-700 hover:bg-violet-50 border-0"
              >
                <Plus className="w-4 h-4 mr-2" /> Schedule New
              </Button>
            </CardContent>
          </Card>

          {/* Stats Widget */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                  <div className="text-2xl font-bold text-violet-600">{meetings.length}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase mt-1">Total Meetings</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {meetings.filter(m => m.status === 'completed').length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium uppercase mt-1">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scheduler Modal */}
      <MeetingSchedulerModal 
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        onSubmit={handleScheduleSubmit}
        initialData={editingMeeting}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the meeting and remove it from your schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete Meeting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ModernMeetingsDashboard;
