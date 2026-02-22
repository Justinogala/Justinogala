
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MeetingDetails from '@/components/meetings/MeetingDetails';
import { localMeetingsStorageService } from '@/services/localMeetingsStorageService';
import { useToast } from '@/components/ui/use-toast';

const MeetingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = async (meetingId) => {
    if (confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      const result = await localMeetingsStorageService.deleteMeeting(meetingId);
      if (result.success) {
        toast({ title: "Meeting deleted" });
        navigate('/meetings');
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <MeetingDetails 
        meetingId={id} 
        onBack={() => navigate('/meetings')}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default MeetingDetailsPage;
