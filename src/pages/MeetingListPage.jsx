
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, Clock, Users, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { meetingService } from '@/services/meetingService';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';

const MeetingListPage = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all

  useEffect(() => {
    if (user) {
      const allMeetings = meetingService.getMeetings(user.id);
      // Sort by date desc
      allMeetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setMeetings(allMeetings);
    }
  }, [user]);

  useEffect(() => {
    let result = meetings;
    const now = new Date();

    // 1. Filter by status/time
    if (filter === 'upcoming') {
      result = result.filter(m => new Date(m.endTime) > now && m.status !== 'cancelled');
    } else if (filter === 'past') {
      result = result.filter(m => new Date(m.endTime) <= now);
    }

    // 2. Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(term) || 
        m.description?.toLowerCase().includes(term)
      );
    }

    setFilteredMeetings(result);
  }, [meetings, searchTerm, filter]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>My Meetings - Munal</title>
        </Helmet>
        
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">My Meetings</h1>
              <p className="text-muted-foreground mt-1">Manage your upcoming schedules and history.</p>
            </div>
            <Link to="/calendar">
               <Button variant="outline">View Calendar</Button>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search meetings..." 
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filter === 'upcoming' ? 'default' : 'outline'} 
                onClick={() => setFilter('upcoming')}
                className={filter === 'upcoming' ? 'bg-indigo-600' : ''}
              >
                Upcoming
              </Button>
              <Button 
                variant={filter === 'past' ? 'default' : 'outline'} 
                onClick={() => setFilter('past')}
              >
                Past
              </Button>
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                onClick={() => setFilter('all')}
              >
                All
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredMeetings.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card/50">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-lg font-medium">No meetings found</h3>
                <p className="text-muted-foreground mb-4">You don't have any meetings in this view.</p>
                <Link to="/calendar">
                   <Button>Schedule a Meeting</Button>
                </Link>
              </div>
            ) : (
              filteredMeetings.map(meeting => (
                <Card key={meeting.id} hover className="group transition-all">
                  <CardContent className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-500 shrink-0">
                        <span className="text-xs font-bold uppercase">{format(new Date(meeting.startTime), 'MMM')}</span>
                        <span className="text-xl font-bold">{format(new Date(meeting.startTime), 'd')}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                           <span className="flex items-center gap-1">
                             <Clock className="w-3.5 h-3.5" /> 
                             {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                           </span>
                           {meeting.attendees?.length > 0 && (
                             <span className="flex items-center gap-1">
                               <Users className="w-3.5 h-3.5" /> 
                               {meeting.attendees.length} Attendees
                             </span>
                           )}
                           <span className={`capitalize ${meeting.status === 'cancelled' ? 'text-red-400' : ''}`}>
                             {meeting.status}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                       <Link to="/calendar" className="w-full md:w-auto">
                         <Button variant="ghost" className="w-full md:w-auto group-hover:translate-x-1 transition-transform">
                           Details <ArrowRight className="w-4 h-4 ml-2" />
                         </Button>
                       </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default MeetingListPage;
