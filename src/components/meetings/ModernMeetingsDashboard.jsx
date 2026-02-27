
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
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  // Load meetings from MongoDB calendar events
  const loadMeetings = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/calendar/events?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Transform calendar events to meeting card format
        const transformedMeetings = (data.events || []).map(event => {
          const startDate = parseISO(event.start_time);
          return {
            id: event.id,
            title: event.title,
            description: event.description || '',
            date: format(startDate, 'yyyy-MM-dd'),
            time: format(startDate, 'HH:mm'),
            status: new Date(event.start_time) > new Date() ? 'upcoming' : 'completed',
            meetingUrl: event.video_call_link || '',
            platform: event.video_call ? 'internal' : 'internal',
            type: event.video_call ? 'video' : 'meeting',
            hasRecording: false,
            participants: event.invitees?.map(inv => ({
              name: inv.name || inv.email,
              email: inv.email
            })) || [],
            createdAt: event.created_at,
            isCalendarEvent: true,
            color: event.color,
            category: event.category,
            location: event.location,
            hasVideo: event.video_call
          };
        });
        setMeetings(transformedMeetings);
      }
    } catch (error) {
      console.error("Failed to load meetings:", error);
      toast({
        title: "Error",
        description: "Failed to load meetings from calendar.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Load meetings on mount
  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleEditMeeting = (id) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting) {
      // Redirect to calendar page for editing calendar events
      navigate(`/calendar?event=${id}&action=edit`);
    }
  };

  const handleDeleteClick = (id) => {
    setMeetingToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!meetingToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/api/calendar/events/${meetingToDelete}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Meeting Deleted",
          description: "The meeting has been permanently removed.",
        });
        loadMeetings();
      } else {
        throw new Error('Failed to delete meeting');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meeting. Please try again.",
        variant: "destructive"
      });
    }
    setDeleteConfirmOpen(false);
    setMeetingToDelete(null);
  };

  // Handle joining a meeting
  const handleJoinMeeting = (id) => {
    const meeting = meetings.find(m => m.id === id);
    if (meeting?.meetingUrl) {
      window.open(meeting.meetingUrl, '_blank');
    } else if (meeting?.hasVideo) {
      navigate(`/meeting/${id}`);
    } else if (onJoinClick) {
      onJoinClick(id);
    }
  };

  // Derived state for dashboard widgets
  const upcomingMeetings = meetings
    .filter(m => {
      const meetDate = new Date(`${m.date}T${m.time}`);
      return meetDate > new Date();
    })
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 2);

  return (
    <div className="space-y-8 animate-in fade-in duration-500" data-testid="meetings-dashboard">
      
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
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/calendar')}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25"
            data-testid="open-calendar-btn"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Open Calendar
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
               <Badge variant="secondary" className="text-xs">
                 {meetings.length} total
               </Badge>
             </div>
             <MeetingsList 
               meetings={meetings}
               loading={loading}
               onView={handleJoinMeeting}
               onEdit={handleEditMeeting}
               onDelete={handleDeleteClick}
               onCreateNew={() => navigate('/calendar')}
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
                    <div 
                      key={meeting.id} 
                      className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" 
                      onClick={() => handleJoinMeeting(meeting.id)}
                      data-testid={`upcoming-meeting-${meeting.id}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm line-clamp-1">{meeting.title}</span>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-[10px] h-5">
                          {meeting.time}
                        </Badge>
                      </div>
                      <p className="text-xs text-violet-100 opacity-80">
                        {format(new Date(meeting.date), 'MMM d')} • {meeting.hasVideo ? 'Video Call' : 'Meeting'}
                      </p>
                      {meeting.hasVideo && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-violet-200">
                          <Video className="w-3 h-3" />
                          <span>Video enabled</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-violet-100/80 text-sm">
                  No upcoming meetings scheduled.
                </div>
              )}
              
              <Button 
                onClick={() => navigate('/calendar')}
                variant="secondary" 
                className="w-full mt-4 bg-white text-violet-700 hover:bg-violet-50 border-0"
                data-testid="schedule-new-btn"
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
                    {upcomingMeetings.length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium uppercase mt-1">Upcoming</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
