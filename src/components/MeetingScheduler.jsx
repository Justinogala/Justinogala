
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Globe, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { meetingService } from '@/services/meetingService';
import { timeZoneService } from '@/services/timeZoneService';
import { useAuth } from '@/context/AuthContext';

const MeetingScheduler = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    link: '',
    timezone: timeZoneService.detectUserTimeZone(),
    attendeesRaw: ''
  });

  const timezones = timeZoneService.getAllTimeZones();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }

      const attendees = formData.attendeesRaw.split(',').map(e => e.trim()).filter(e => e).map(email => ({ email, status: 'pending' }));

      const meetingData = {
        userId: user.id,
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: formData.location,
        link: formData.link,
        timezone: formData.timezone,
        attendees: attendees,
        reminders: [15], // Default 15 min reminder
        color: '#4f46e5' // Default indigo
      };

      await meetingService.createMeeting(meetingData);
      
      toast({ title: "Meeting Scheduled", description: `"${formData.title}" has been created.` });
      
      if (onCreated) onCreated();
      if (onClose) onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Schedule Meeting</h2>
        <p className="text-sm text-muted-foreground">Set up a new meeting and invite attendees.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Title"
          required
          value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})}
          placeholder="e.g. Weekly Standup"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input 
            type="date" 
            label="Date"
            required
            value={formData.date} 
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
          <div className="space-y-2">
             <label className="text-sm font-medium">Timezone</label>
             <Select value={formData.timezone} onValueChange={v => setFormData({...formData, timezone: v})}>
               <SelectTrigger className="w-full bg-white/5 border-white/20">
                 <SelectValue placeholder="Select Timezone" />
               </SelectTrigger>
               <SelectContent>
                 {timezones.map(tz => (
                   <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            type="time" 
            label="Start Time"
            required
            value={formData.startTime} 
            onChange={e => setFormData({...formData, startTime: e.target.value})}
          />
          <Input 
            type="time" 
            label="End Time"
            required
            value={formData.endTime} 
            onChange={e => setFormData({...formData, endTime: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
             <Users className="w-4 h-4" /> Attendees
          </label>
          <Input 
            placeholder="email@example.com, colleague@work.com"
            value={formData.attendeesRaw}
            onChange={e => setFormData({...formData, attendeesRaw: e.target.value})}
          />
          <p className="text-xs text-muted-foreground">Separate emails with commas</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Meeting Link (Optional)
          </label>
          <Input 
             placeholder="https://zoom.us/j/..."
             value={formData.link}
             onChange={e => setFormData({...formData, link: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea 
             className="min-h-[100px] bg-white/5 border-white/20"
             placeholder="Meeting agenda..."
             value={formData.description}
             onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MeetingScheduler;
