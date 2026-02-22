
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { meetingService } from '@/services/meetingService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { validateMeetingForm, formatMeetingDateTime } from '@/utils/meetingFormUtils';
import { addMinutes } from 'date-fns';

export const useCreateMeeting = (onSuccess) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();

  const createMeeting = async (formData) => {
    setLoading(true);
    setErrors({});

    // 1. Validate
    const validationErrors = validateMeetingForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the form for errors."
      });
      return false;
    }

    try {
      // 2. Prepare Data
      const startTime = formatMeetingDateTime(formData.date, formData.time);
      const endTime = addMinutes(startTime, parseInt(formData.duration));
      
      const meetingData = {
        id: uuidv4(),
        userId: user?.id,
        title: formData.title,
        description: formData.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration),
        timezone: formData.timezone,
        type: formData.type,
        attendees: formData.participants,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        hostName: user?.name || 'Host',
        location: formData.type === 'in-person' ? 'Office' : 'Virtual Meeting Room'
      };

      // 3. Call Service
      await meetingService.createMeeting(meetingData);

      // 4. Success Handling
      toast({
        title: "Meeting created successfully!",
        description: `${meetingData.title} has been scheduled.`,
      });

      if (meetingData.attendees.length > 0) {
        setTimeout(() => {
          toast({
            title: "Invitations sent",
            description: `Sent invites to ${meetingData.attendees.length} participants.`
          });
        }, 1000);
      }

      if (onSuccess) onSuccess(meetingData);
      return true;

    } catch (error) {
      console.error('Create meeting error:', error);
      toast({
        variant: "destructive",
        title: "Error creating meeting",
        description: error.message || "Something went wrong. Please try again."
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createMeeting,
    loading,
    errors,
    setErrors
  };
};
