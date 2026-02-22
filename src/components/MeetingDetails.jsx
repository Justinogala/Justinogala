
import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Video, Edit2, Trash2, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { meetingService } from '@/services/meetingService';
import { useToast } from '@/components/ui/use-toast';

const MeetingDetails = ({ meeting, onClose, onUpdate }) => {
  const { toast } = useToast();

  if (!meeting) return null;

  const handleCancel = async () => {
    if (confirm("Are you sure you want to cancel this meeting?")) {
      await meetingService.cancelMeeting(meeting.id);
      toast({ title: "Meeting Cancelled", description: "Attendees have been notified." });
      if (onUpdate) onUpdate();
      if (onClose) onClose();
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this meeting permanently?")) {
      meetingService.deleteMeeting(meeting.id);
      toast({ title: "Deleted", description: "Meeting removed from calendar." });
      if (onUpdate) onUpdate();
      if (onClose) onClose();
    }
  };

  const statusColor = {
    scheduled: "text-green-500 bg-green-500/10",
    cancelled: "text-red-500 bg-red-500/10",
    completed: "text-gray-500 bg-gray-500/10"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{meeting.title}</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 capitalize ${statusColor[meeting.status] || "text-gray-500"}`}>
            {meeting.status}
          </span>
        </div>
        <div className="flex gap-2">
          {meeting.status !== 'cancelled' && (
            <>
              <Button size="sm" variant="outline" onClick={handleCancel} title="Cancel Meeting">
                <XCircle className="w-4 h-4 text-orange-500" />
              </Button>
              <Button size="sm" variant="outline" title="Edit Meeting">
                <Edit2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button size="sm" variant="destructive" onClick={handleDelete} title="Delete">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 text-sm">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{format(new Date(meeting.startTime), 'EEEE, MMMM do, yyyy')}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}</span>
        </div>
        {meeting.link && (
          <div className="flex items-center gap-3">
            <Video className="w-4 h-4 text-muted-foreground" />
            <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate">
              {meeting.link}
            </a>
          </div>
        )}
        {meeting.location && (
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{meeting.location}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {meeting.description || "No description provided."}
        </p>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Attendees
        </h3>
        <div className="space-y-2">
          {meeting.attendees && meeting.attendees.length > 0 ? (
            meeting.attendees.map((att, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                <span>{att.email}</span>
                <span className="text-xs text-muted-foreground capitalize">{att.status}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No attendees invited</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetails;
