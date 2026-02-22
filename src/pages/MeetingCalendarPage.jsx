
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import Calendar from '@/components/Calendar';
import MeetingScheduler from '@/components/MeetingScheduler';
import MeetingDetails from '@/components/MeetingDetails';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { meetingService } from '@/services/meetingService';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';

const MeetingCalendarPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    if (user) {
      const userMeetings = meetingService.getMeetings(user.id);
      setEvents(userMeetings);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleDateClick = (date) => {
    // Optional: Pre-fill date in scheduler if needed, currently just opens scheduler
    setIsSchedulerOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedMeeting(event);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>Calendar - Munal</title>
        </Helmet>
        
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-text-primary">Calendar</h1>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              onClick={() => setIsSchedulerOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Schedule Meeting
            </Button>
          </div>

          <div className="bg-card rounded-xl shadow-lg border border-border">
            <Calendar 
              events={events} 
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          </div>
        </main>

        {/* Schedule Modal */}
        <Modal 
          isOpen={isSchedulerOpen} 
          onClose={() => setIsSchedulerOpen(false)}
          title="Schedule New Meeting"
        >
          <MeetingScheduler 
             onClose={() => setIsSchedulerOpen(false)} 
             onCreated={fetchEvents}
          />
        </Modal>

        {/* Details Modal */}
        <Modal 
          isOpen={!!selectedMeeting} 
          onClose={() => setSelectedMeeting(null)}
          title="Meeting Details"
        >
          <MeetingDetails 
            meeting={selectedMeeting} 
            onClose={() => setSelectedMeeting(null)}
            onUpdate={fetchEvents}
          />
        </Modal>

      </div>
    </PageTransition>
  );
};

export default MeetingCalendarPage;
