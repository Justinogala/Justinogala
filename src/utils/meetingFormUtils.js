
import { addHours, format, isAfter, isBefore, setHours, setMinutes, startOfDay } from 'date-fns';

export const timeZoneOptions = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'EST (Eastern Standard Time)' },
  { value: 'America/Chicago', label: 'CST (Central Standard Time)' },
  { value: 'America/Denver', label: 'MST (Mountain Standard Time)' },
  { value: 'America/Los_Angeles', label: 'PST (Pacific Standard Time)' },
  { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
  { value: 'Europe/Paris', label: 'CET (Central European Time)' },
  { value: 'Asia/Kolkata', label: 'IST (Indian Standard Time)' },
  { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
  { value: 'Australia/Sydney', label: 'AEDT (Australian Eastern Daylight Time)' },
];

export const durationOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

export const meetingTypes = [
  { value: 'video', label: 'Video Conference' },
  { value: 'audio', label: 'Audio Call' },
  { value: 'in-person', label: 'In Person' },
];

export const validateMeetingForm = (formData) => {
  const errors = {};
  const today = startOfDay(new Date());
  const selectedDate = startOfDay(new Date(formData.date));

  if (!formData.title?.trim()) {
    errors.title = 'Meeting title is required';
  }

  if (!formData.date) {
    errors.date = 'Date is required';
  } else if (isBefore(selectedDate, today)) {
    errors.date = 'Date cannot be in the past';
  }

  if (!formData.time) {
    errors.time = 'Time is required';
  } else if (formData.date) {
    // Check if time is in past for today
    const now = new Date();
    const [hours, minutes] = formData.time.split(':');
    const meetingDateTime = setMinutes(setHours(new Date(formData.date), parseInt(hours)), parseInt(minutes));
    
    if (isBefore(meetingDateTime, now)) {
      errors.time = 'Time cannot be in the past';
    }
  }

  if (formData.participants && formData.participants.length === 0) {
    // Optional: errors.participants = 'At least one participant is required';
  }

  return errors;
};

export const formatMeetingDateTime = (date, time) => {
  if (!date || !time) return null;
  const [hours, minutes] = time.split(':');
  const dateTime = setMinutes(setHours(new Date(date), parseInt(hours)), parseInt(minutes));
  return dateTime;
};
