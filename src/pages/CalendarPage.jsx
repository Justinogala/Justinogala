import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Clock, MapPin, Users, Video, X, Edit, Trash2, Check,
  Bell, Repeat, Circle, Link, Zap, Copy
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, addMonths, subMonths, isSameMonth, isSameDay, 
  parseISO, addWeeks, subWeeks, startOfDay, endOfDay,
  setHours, setMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';

import { getApiUrl, API_URL } from '@/lib/api';

const EVENT_COLORS = {
  blue: { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  green: { bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500' },
  red: { bg: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-500' },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500' },
  pink: { bg: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500' },
};

const CATEGORIES = [
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'reminder', label: 'Reminder', icon: Bell },
  { value: 'task', label: 'Task', icon: Check },
  { value: 'personal', label: 'Personal', icon: Circle },
];

const CalendarPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    location: '',
    color: 'blue',
    category: 'meeting',
    recurrence: 'none',
    video_call: false,
    meeting_link: '',
    invitees: [],
    inviteEmail: ''
  });

  // Load events
  const loadEvents = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const start = format(startOfMonth(subMonths(currentDate, 1)), "yyyy-MM-dd'T'00:00:00'Z'");
      const end = format(endOfMonth(addMonths(currentDate, 1)), "yyyy-MM-dd'T'23:59:59'Z'");
      
      const response = await fetch(
        `${API_URL}/api/calendar/events?user_id=${user.id}&start_date=${start}&end_date=${end}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentDate, toast]);

  // Load workspace users for invites
  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setWorkspaceUsers((data.users || []).filter(u => u.id !== user?.id));
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEvents();
    loadUsers();
  }, [loadEvents, loadUsers]);

  // Navigation
  const navigate = (direction) => {
    if (view === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Create/Edit event
  const handleCreateEvent = async () => {
    if (!eventForm.title) {
      toast({ variant: 'destructive', title: 'Title required' });
      return;
    }
    
    try {
      const endpoint = selectedEvent 
        ? `${API_URL}/api/calendar/events/${selectedEvent.id}`
        : `${API_URL}/api/calendar/events`;
      
      const method = selectedEvent ? 'PUT' : 'POST';
      
      // Format invitees for backend - extract emails
      const formattedInvitees = eventForm.invitees.map(inv => {
        if (typeof inv === 'string') {
          const user = workspaceUsers.find(u => u.id === inv);
          return user?.email || inv;
        }
        return inv.email;
      }).filter(Boolean);
      
      const body = selectedEvent ? {
        ...eventForm,
        invitees: formattedInvitees
      } : {
        ...eventForm,
        invitees: formattedInvitees,
        created_by: user.id,
        recurrence: eventForm.recurrence === 'none' ? null : eventForm.recurrence
      };
      
      // Remove the inviteEmail field as it's only for UI
      delete body.inviteEmail;
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) throw new Error('Failed to save event');
      
      toast({ 
        title: selectedEvent ? 'Event Updated' : 'Event Created',
        description: formattedInvitees.length > 0 ? `Invitations sent to ${formattedInvitees.length} participant(s)` : undefined
      });
      
      setShowEventModal(false);
      resetForm();
      loadEvents();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/calendar/events/${eventId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      toast({ title: 'Event Deleted' });
      setShowEventDetails(false);
      loadEvents();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      all_day: false,
      location: '',
      color: 'blue',
      category: 'meeting',
      recurrence: 'none',
      video_call: false,
      meeting_link: '',
      invitees: []
    });
    setSelectedEvent(null);
  };

  const openCreateModal = (date = null) => {
    resetForm();
    if (date) {
      const startTime = setMinutes(setHours(date, 9), 0);
      const endTime = setMinutes(setHours(date, 10), 0);
      setEventForm(prev => ({
        ...prev,
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16)
      }));
    }
    setShowEventModal(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16),
      all_day: event.all_day,
      location: event.location || '',
      color: event.color,
      category: event.category,
      recurrence: event.recurrence || 'none',
      video_call: event.video_call,
      invitees: event.invitees?.map(i => i.user_id) || []
    });
    setShowEventDetails(false);
    setShowEventModal(true);
  };

  // Soft pastel tints for calendar cells — rotate by day-of-week
  const DAY_TINTS = [
    'bg-rose-50/60 dark:bg-rose-950/10',       // Sun
    'bg-sky-50/60 dark:bg-sky-950/10',          // Mon
    'bg-violet-50/60 dark:bg-violet-950/10',    // Tue
    'bg-amber-50/60 dark:bg-amber-950/10',      // Wed
    'bg-teal-50/60 dark:bg-teal-950/10',        // Thu
    'bg-indigo-50/60 dark:bg-indigo-950/10',    // Fri
    'bg-pink-50/60 dark:bg-pink-950/10',        // Sat
  ];

  // Render calendar grid
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayOfWeek = currentDay.getDay();
        const dayEvents = events.filter(e => 
          isSameDay(parseISO(e.start_time), currentDay)
        );
        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);
        const hasEvents = dayEvents.length > 0;
        
        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[120px] border border-gray-100 dark:border-gray-800/60 p-2 cursor-pointer transition-all duration-200 overflow-hidden relative group",
              // Outside-month cells are muted
              !isCurrentMonth && "bg-gray-50/80 dark:bg-gray-900/40 opacity-60",
              // Current month cells get day-of-week tint
              isCurrentMonth && !isToday && DAY_TINTS[dayOfWeek],
              // Today gets a vivid highlight
              isToday && "bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-purple-950/20 ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500 shadow-sm",
              // Days with events get a subtle left accent
              hasEvents && isCurrentMonth && !isToday && "border-l-[3px] border-l-purple-400 dark:border-l-purple-500",
              // Hover
              "hover:shadow-md hover:scale-[1.01] hover:z-10 hover:bg-white/80 dark:hover:bg-slate-800/60"
            )}
            onClick={() => openCreateModal(currentDay)}
          >
            {/* Subtle dot indicator for days with events */}
            {hasEvents && !isToday && isCurrentMonth && (
              <div className="absolute top-1.5 right-2 flex gap-0.5">
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", EVENT_COLORS[e.color]?.bg)} />
                ))}
              </div>
            )}
            <div className="flex justify-between items-start mb-1">
              <span className={cn(
                "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                !isCurrentMonth && "text-gray-400 dark:text-gray-600",
                isToday && "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-300/50 dark:shadow-indigo-800/50",
                isCurrentMonth && !isToday && "text-gray-700 dark:text-gray-300 group-hover:bg-gray-200/60 dark:group-hover:bg-gray-700/40"
              )}>
                {format(day, 'd')}
              </span>
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs leading-tight px-2 py-1 rounded-md truncate cursor-pointer font-medium border-l-2 transition-all hover:translate-x-0.5",
                    EVENT_COLORS[event.color]?.light,
                    EVENT_COLORS[event.color]?.text,
                    EVENT_COLORS[event.color]?.border
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                    setShowEventDetails(true);
                  }}
                >
                  {!event.all_day && format(parseISO(event.start_time), 'HH:mm')} {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-purple-500 dark:text-purple-400 px-2 font-semibold">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day.toString()} className="grid grid-cols-7 flex-1 min-h-0">{days}</div>);
      days = [];
    }
    
    return <div className="flex flex-col flex-1 min-h-0">{rows}</div>;
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), day));
      
      days.push(
        <div key={i} className="flex-1 border-r border-gray-200 dark:border-gray-800 last:border-r-0">
          <div className={cn(
            "p-3 text-center border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-slate-950 z-10",
            isSameDay(day, new Date()) && "bg-indigo-50 dark:bg-indigo-900/20"
          )}>
            <div className="text-xs text-gray-500 uppercase">{format(day, 'EEE')}</div>
            <div className={cn(
              "text-2xl font-bold",
              isSameDay(day, new Date()) && "text-indigo-600"
            )}>{format(day, 'd')}</div>
          </div>
          <div className="p-2 space-y-2 min-h-[400px]" onClick={() => openCreateModal(day)}>
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={cn(
                  "p-2 rounded-lg cursor-pointer border-l-4",
                  EVENT_COLORS[event.color]?.light,
                  EVENT_COLORS[event.color]?.border
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setShowEventDetails(true);
                }}
              >
                <div className="font-medium text-sm">{event.title}</div>
                <div className="text-xs text-gray-500">
                  {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                </div>
                {event.video_call && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    <Video className="w-3 h-3 mr-1" /> Video Call
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return <div className="flex">{days}</div>;
  };

  return (
    <PageTransition>
      <Helmet><title>Calendar | Munal AI</title></Helmet>
      
      <div className="h-full flex flex-col -m-4 sm:-m-6 lg:-m-8" style={{height: 'calc(100vh - 64px)'}}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Week of' MMM d, yyyy" : 'EEEE, MMMM d, yyyy')}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
            
            {/* View Switcher */}
            <div className="flex border rounded-lg overflow-hidden">
              {['month', 'week', 'day'].map(v => (
                <Button
                  key={v}
                  variant={view === v ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none capitalize"
                  onClick={() => setView(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
            
            {/* Create Event */}
            <Button onClick={() => openCreateModal()} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> New Event
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 p-6">
          {/* Week day headers for month view */}
          {view === 'month' && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
                {[
                  { day: 'Sun', color: 'text-rose-500' },
                  { day: 'Mon', color: 'text-sky-500' },
                  { day: 'Tue', color: 'text-violet-500' },
                  { day: 'Wed', color: 'text-amber-500' },
                  { day: 'Thu', color: 'text-teal-500' },
                  { day: 'Fri', color: 'text-indigo-500' },
                  { day: 'Sat', color: 'text-pink-500' },
                ].map(({ day, color }) => (
                  <div key={day} className={cn("text-center font-semibold text-sm py-3", color)}>
                    {day}
                  </div>
                ))}
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {renderMonthView()}
                </div>
              )}
            </div>
          )}
          
          {view !== 'month' && (
            loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex-1">
                <ScrollArea className="h-full">
                  {renderWeekView()}
                </ScrollArea>
              </div>
            )
          )}
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>Fill in the details for your event or meeting.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input 
                value={eventForm.title}
                onChange={e => setEventForm({...eventForm, title: e.target.value})}
                placeholder="Event title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start</Label>
                <Input 
                  type="datetime-local"
                  value={eventForm.start_time}
                  onChange={e => setEventForm({...eventForm, start_time: e.target.value})}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input 
                  type="datetime-local"
                  value={eventForm.end_time}
                  onChange={e => setEventForm({...eventForm, end_time: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={eventForm.all_day}
                    onCheckedChange={v => setEventForm({...eventForm, all_day: v})}
                  />
                  <Label>All day</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={eventForm.video_call}
                    onCheckedChange={v => setEventForm({...eventForm, video_call: v, meeting_link: v ? eventForm.meeting_link : ''})}
                  />
                  <Label>Video call</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const instantId = uuidv4();
                    const instantLink = `${window.location.origin}/meet/${instantId}`;
                    setEventForm({
                      ...eventForm, 
                      video_call: true, 
                      meeting_link: instantLink
                    });
                    navigator.clipboard.writeText(instantLink);
                    toast({
                      title: 'Instant Meeting Created!',
                      description: 'Meeting link has been generated and copied to clipboard.',
                    });
                  }}
                  className="bg-violet-50 hover:bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 dark:text-violet-400 dark:border-violet-700"
                  data-testid="instant-meeting-btn"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Instant Meeting
                </Button>
              </div>
              
              {/* Meeting Link Input - shown when video call is enabled */}
              {eventForm.video_call && (
                <div className="pl-0 space-y-2">
                  <Label className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-indigo-500" />
                    Meeting Link
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={eventForm.meeting_link}
                      onChange={e => setEventForm({...eventForm, meeting_link: e.target.value})}
                      placeholder="https://conferencing.jizira.com/your-meeting-room"
                      className="font-mono text-sm flex-1"
                    />
                    {eventForm.meeting_link && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(eventForm.meeting_link);
                          toast({ title: 'Link copied!' });
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter a Jizira meeting link or use Instant Meeting to auto-generate one.{' '}
                    <a 
                      href="https://conferencing.jizira.com/register" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:text-indigo-600 underline"
                    >
                      Create Jizira room
                    </a>
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <Label>Location</Label>
              <Input 
                value={eventForm.location}
                onChange={e => setEventForm({...eventForm, location: e.target.value})}
                placeholder="Add location"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea 
                value={eventForm.description}
                onChange={e => setEventForm({...eventForm, description: e.target.value})}
                placeholder="Add description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={eventForm.category} onValueChange={v => setEventForm({...eventForm, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {Object.keys(EVENT_COLORS).map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full",
                        EVENT_COLORS[color].bg,
                        eventForm.color === color && "ring-2 ring-offset-2 ring-gray-400"
                      )}
                      onClick={() => setEventForm({...eventForm, color})}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label>Recurrence</Label>
              <Select value={eventForm.recurrence} onValueChange={v => setEventForm({...eventForm, recurrence: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Invite Members</Label>
              
              {/* Email input for external invites */}
              <div className="mt-2 flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email to invite..."
                  value={eventForm.inviteEmail || ''}
                  onChange={e => setEventForm({...eventForm, inviteEmail: e.target.value})}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && eventForm.inviteEmail) {
                      e.preventDefault();
                      const email = eventForm.inviteEmail.trim();
                      if (email && !eventForm.invitees.some(inv => inv.email === email)) {
                        setEventForm({
                          ...eventForm, 
                          invitees: [...eventForm.invitees, { email, type: 'external' }],
                          inviteEmail: ''
                        });
                      }
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const email = (eventForm.inviteEmail || '').trim();
                    if (email && !eventForm.invitees.some(inv => inv.email === email)) {
                      setEventForm({
                        ...eventForm, 
                        invitees: [...eventForm.invitees, { email, type: 'external' }],
                        inviteEmail: ''
                      });
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Selected invitees badges */}
              {eventForm.invitees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {eventForm.invitees.map((inv, idx) => {
                    const invEmail = typeof inv === 'string' ? inv : inv.email;
                    const invName = typeof inv === 'string' 
                      ? workspaceUsers.find(u => u.id === inv)?.name || invEmail
                      : inv.name || invEmail;
                    return (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        <span className="text-xs">{invName}</span>
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-red-500" 
                          onClick={() => setEventForm({
                            ...eventForm, 
                            invitees: eventForm.invitees.filter((_, i) => i !== idx)
                          })}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {/* Team members list */}
              {workspaceUsers.length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-gray-500">Team Members</Label>
                  <div className="mt-1 space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                    {workspaceUsers.map(u => {
                      const isSelected = eventForm.invitees.some(
                        inv => (typeof inv === 'string' ? inv === u.id : inv.id === u.id)
                      );
                      return (
                        <label 
                          key={u.id} 
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            isSelected 
                              ? "bg-indigo-50 dark:bg-indigo-900/30" 
                              : "hover:bg-gray-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) {
                                setEventForm({
                                  ...eventForm, 
                                  invitees: [...eventForm.invitees, { id: u.id, email: u.email, name: u.name, type: 'member' }]
                                });
                              } else {
                                setEventForm({
                                  ...eventForm, 
                                  invitees: eventForm.invitees.filter(inv => 
                                    typeof inv === 'string' ? inv !== u.id : inv.id !== u.id
                                  )
                                });
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs">
                              {u.name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{u.name || 'No name'}</div>
                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {workspaceUsers.length === 0 && eventForm.invitees.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Enter email addresses to invite participants
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent} className="bg-indigo-600 hover:bg-indigo-700">
              {selectedEvent ? 'Update' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-md">
          {selectedEvent && (
            <>
              <div className={cn("h-2 -mt-6 -mx-6 rounded-t-lg", EVENT_COLORS[selectedEvent.color]?.bg)} />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Clock className="w-5 h-5" />
                  <div>
                    <div>{format(parseISO(selectedEvent.start_time), 'EEEE, MMMM d, yyyy')}</div>
                    <div className="text-sm">
                      {format(parseISO(selectedEvent.start_time), 'h:mm a')} - {format(parseISO(selectedEvent.end_time), 'h:mm a')}
                    </div>
                  </div>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.video_call && (
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-indigo-500" />
                    {selectedEvent.meeting_link ? (
                      <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
                        <a href={selectedEvent.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Video className="w-4 h-4 mr-2" />
                          Join Meeting
                        </a>
                      </Button>
                    ) : (
                      <span className="text-gray-500 text-sm">Video call enabled (no link provided)</span>
                    )}
                  </div>
                )}
                
                {selectedEvent.recurrence && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Repeat className="w-5 h-5" />
                    <span className="capitalize">Repeats {selectedEvent.recurrence}</span>
                  </div>
                )}
                
                {selectedEvent.invitees?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                      <Users className="w-5 h-5" />
                      <span>{selectedEvent.invitees.length} Attendees</span>
                    </div>
                    <div className="space-y-2">
                      {selectedEvent.invitees.map(inv => (
                        <div key={inv.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gray-200">{inv.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{inv.name || inv.email}</span>
                          </div>
                          <Badge variant={inv.status === 'accepted' ? 'default' : inv.status === 'declined' ? 'destructive' : 'secondary'}>
                            {inv.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedEvent.description}</p>
                )}
              </div>
              
              <DialogFooter>
                {selectedEvent.created_by === user?.id && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(selectedEvent.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                    <Button size="sm" onClick={() => openEditModal(selectedEvent)}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default CalendarPage;
