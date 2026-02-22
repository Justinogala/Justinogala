
import { format, isAfter, parseISO, isValid, addMinutes, setHours, setMinutes } from 'date-fns';

export const formatMeetingDateTime = (date, time) => {
  if (!date || !time) return '';
  const dateObj = new Date(`${date}T${time}`);
  if (!isValid(dateObj)) return '';
  return format(dateObj, "MMM d, yyyy 'at' h:mm a");
};

export const formatMeetingDate = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'MMM d, yyyy');
};

export const formatMeetingTime = (time) => {
  if (!time) return '';
  // Append a dummy date to parse time correctly if just HH:mm
  const [hours, minutes] = time.split(':');
  const dateObj = new Date();
  dateObj.setHours(parseInt(hours), parseInt(minutes));
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'h:mm a');
};

export const isDateInFuture = (date, time) => {
  if (!date || !time) return false;
  const dateTimeStr = `${date}T${time}`;
  const meetingDate = new Date(dateTimeStr);
  return isAfter(meetingDate, new Date());
};

export const getTimeSlotOptions = (intervalMinutes = 30) => {
  const options = [];
  let current = setMinutes(setHours(new Date(), 0), 0);
  const end = setMinutes(setHours(new Date(), 23), 59);

  // We actually want a standard list of times for a picker (e.g. 09:00, 09:30)
  // regardless of "now".
  // Let's generate 24h of slots.
  const startOfDay = setMinutes(setHours(new Date(), 0), 0);
  
  for (let i = 0; i < 24 * (60 / intervalMinutes); i++) {
    const timeSlot = addMinutes(startOfDay, i * intervalMinutes);
    options.push({
      value: format(timeSlot, 'HH:mm'),
      label: format(timeSlot, 'h:mm a')
    });
  }
  return options;
};
