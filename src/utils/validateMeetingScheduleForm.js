
import { isDateInFuture } from './dateTimeFormatter';

export const validateMeetingScheduleForm = (formData) => {
  const errors = {};

  // Title validation
  if (!formData.title || formData.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters long.";
  }

  // Date validation
  if (!formData.date) {
    errors.date = "Date is required.";
  } else if (formData.time && !isDateInFuture(formData.date, formData.time)) {
    // Only check future date if time is also present, or check date alone vs end of today?
    // The prompt says "must be future date". 
    // Usually standard to check date+time combo.
    errors.date = "Meeting must be scheduled for a future date and time.";
  }

  // Time validation
  if (!formData.time) {
    errors.time = "Time is required.";
  } else {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.time)) {
      errors.time = "Invalid time format.";
    }
  }

  // Participants validation (optional, but if present must be emails)
  if (formData.participants && formData.participants.trim().length > 0) {
    const emails = formData.participants.split(',').map(e => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => email.length > 0 && !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      errors.participants = `Invalid email format: ${invalidEmails.join(', ')}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
