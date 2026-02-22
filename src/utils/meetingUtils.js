
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow, format } from 'date-fns';

export const generateMeetingId = () => {
  return uuidv4().slice(0, 8);
};

export const formatMeetingTime = (date, time) => {
  if (!date || !time) return '';
  try {
    const dateTime = new Date(`${date}T${time}`);
    return format(dateTime, 'h:mm a');
  } catch (error) {
    return time;
  }
};

export const copyToClipboard = async (text) => {
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export const generateMeetingLink = (id) => {
  return `${window.location.origin}/meet/${id}`;
};

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch (error) {
    return 'Just now';
  }
};
