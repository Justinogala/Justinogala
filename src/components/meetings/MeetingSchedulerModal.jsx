
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar, AlertCircle } from 'lucide-react';
import { validateMeetingScheduleForm } from '@/utils/validateMeetingScheduleForm';
import { getTimeSlotOptions } from '@/utils/dateTimeFormatter';
import VideoConferencingSelector from './VideoConferencingSelector';
import { DEFAULT_PLATFORM, EXTERNAL_URL_PLATFORMS } from '@/config/videoConferencingConfig';

const MeetingSchedulerModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  isSubmitting = false 
}) => {
  const defaultFormState = {
    title: '',
    description: '',
    date: '',
    time: '10:00',
    duration: '30',
    type: 'video',
    platform: DEFAULT_PLATFORM, // Default to Jizira
    meetingUrl: '',
    participants: ''
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const timeSlots = getTimeSlotOptions(15);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...defaultFormState,
          ...initialData,
          participants: Array.isArray(initialData.participants) 
            ? initialData.participants.join(', ') 
            : (initialData.participants || '')
        });
      } else {
        setFormData(defaultFormState);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateMeetingScheduleForm(formData);
    
    // Additional validation for platform URL
    const isExternalPlatform = EXTERNAL_URL_PLATFORMS.includes(formData.platform);
    if (isExternalPlatform && !formData.meetingUrl) {
      validationErrors.meetingUrl = "Meeting URL is required.";
    }

    if (!isValid || (isExternalPlatform && !formData.meetingUrl)) {
      setErrors(validationErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    const submissionData = {
      ...formData,
      participants: formData.participants 
        ? formData.participants.split(',').map(p => p.trim()).filter(p => p) 
        : []
    };

    onSubmit(submissionData);
  };

  const getUrlLabel = () => {
    switch(formData.platform) {
      case 'jizira': return 'Jizira Meeting URL';
      case 'zoom': return 'Zoom Link';
      case 'google-meet': return 'Google Meet Link';
      case 'microsoft-teams': return 'Microsoft Teams Link';
      default: return 'External Meeting URL';
    }
  };

  const isExternalPlatform = EXTERNAL_URL_PLATFORMS.includes(formData.platform);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Meeting' : 'Schedule New Meeting'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details for your existing meeting.' : 'Fill in the details below to schedule a new meeting.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="e.g., Q4 Strategy Sync"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.title}
              </p>
            )}
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  onBlur={() => handleBlur('date')}
                  className={`pl-9 ${errors.date ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time <span className="text-red-500">*</span></Label>
              <Select
                value={formData.time}
                onValueChange={(val) => handleChange('time', val)}
              >
                <SelectTrigger id="time" className={errors.time ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map(slot => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}
            </div>
          </div>

          {/* Video Platform Selector */}
          <div className="space-y-4">
            <VideoConferencingSelector 
              value={formData.platform}
              onChange={(val) => handleChange('platform', val)}
            />
            
            {isExternalPlatform && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="meetingUrl">{getUrlLabel()} <span className="text-red-500">*</span></Label>
                <Input
                  id="meetingUrl"
                  placeholder={formData.platform === 'jizira' ? 'https://jizira.com/...' : 'https://...'}
                  value={formData.meetingUrl}
                  onChange={(e) => handleChange('meetingUrl', e.target.value)}
                  className={errors.meetingUrl ? "border-red-500" : ""}
                />
                {errors.meetingUrl && <p className="text-sm text-red-500">{errors.meetingUrl}</p>}
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select
                value={formData.duration}
                onValueChange={(val) => handleChange('duration', val)}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label htmlFor="participants">Participants</Label>
            <Input
              id="participants"
              placeholder="Enter email addresses, separated by commas"
              value={formData.participants}
              onChange={(e) => handleChange('participants', e.target.value)}
              onBlur={() => handleBlur('participants')}
              className={errors.participants ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.participants && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.participants}
              </p>
            )}
            <p className="text-xs text-slate-500">Optional. Separate multiple emails with commas.</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Meeting agenda, notes, or topics to discuss..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isSubmitting}>
              {initialData ? 'Update Meeting' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingSchedulerModal;
