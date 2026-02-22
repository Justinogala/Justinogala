
import { calendarService } from './calendarService';
import { emailService } from './emailService';
import { reminderService } from './reminderService';

// Meeting Service acts as a higher-level abstraction over Calendar Service for business logic
export const meetingService = {
  createMeeting: async (meetingData) => {
    // 1. Create calendar event
    const event = calendarService.createEvent({
      ...meetingData,
      type: 'meeting',
      status: 'scheduled'
    });

    // 2. Schedule reminders
    if (meetingData.reminders) {
      meetingData.reminders.forEach(min => {
        reminderService.scheduleReminder(event.id, min);
      });
    }

    // 3. Send invites
    if (meetingData.attendees && meetingData.attendees.length > 0) {
      await emailService.sendInvitation(event, meetingData.attendees);
    }

    return event;
  },

  getMeetings: (userId) => {
    // Filter calendar events for type 'meeting'
    return calendarService.getEvents({ userId }).filter(e => e.type === 'meeting');
  },

  updateMeeting: async (id, updates) => {
    const original = calendarService.getEventById(id);
    const updated = calendarService.updateEvent(id, updates);

    // If time/location changed, send update
    if (original.startTime !== updated.startTime || original.location !== updated.location) {
        if (updated.attendees) {
            await emailService.sendUpdate(updated, updated.attendees, { timeChanged: true });
        }
    }

    return updated;
  },

  cancelMeeting: async (id) => {
    const meeting = calendarService.getEventById(id);
    if (meeting) {
        if (meeting.attendees) {
            await emailService.sendCancellation(meeting, meeting.attendees);
        }
        reminderService.cancelRemindersForMeeting(id);
        calendarService.updateEvent(id, { status: 'cancelled', color: 'gray' });
    }
  },

  deleteMeeting: (id) => {
    calendarService.deleteEvent(id);
    reminderService.cancelRemindersForMeeting(id);
  }
};
