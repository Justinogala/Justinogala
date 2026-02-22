
import { emailService } from './emailService';

const REMINDERS_KEY = 'munal_reminders';

const getReminders = () => {
  try {
    return JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveReminders = (reminders) => {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

export const reminderService = {
  scheduleReminder: (meetingId, minutesBefore, type = 'email') => {
    const reminders = getReminders();
    const newReminder = {
      id: `rem_${Math.random().toString(36).substr(2, 9)}`,
      meetingId,
      minutesBefore,
      type,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    reminders.push(newReminder);
    saveReminders(reminders);
    console.log(`[ReminderService] Scheduled ${type} reminder for meeting ${meetingId}`);
    return newReminder;
  },

  cancelRemindersForMeeting: (meetingId) => {
    const reminders = getReminders();
    const filtered = reminders.filter(r => r.meetingId !== meetingId);
    saveReminders(filtered);
  },

  // Mock function that would be run by a cron job or interval
  checkPendingReminders: async (meetings) => {
    const reminders = getReminders();
    const now = new Date();
    
    const updatedReminders = await Promise.all(reminders.map(async (reminder) => {
      if (reminder.status !== 'pending') return reminder;

      const meeting = meetings.find(m => m.id === reminder.meetingId);
      if (!meeting) return { ...reminder, status: 'orphaned' };

      const meetingTime = new Date(meeting.startTime);
      const reminderTime = new Date(meetingTime.getTime() - (reminder.minutesBefore * 60000));

      if (now >= reminderTime) {
        // Trigger reminder
        if (reminder.type === 'email') {
          // Send to all attendees (simplified)
          const attendees = meeting.attendees || [];
          attendees.forEach(att => emailService.sendReminder(meeting, att));
        } else {
           // Push notification mock
           console.log(`[Notification] Meeting "${meeting.title}" starts in ${reminder.minutesBefore} minutes.`);
        }
        return { ...reminder, status: 'sent', sentAt: now.toISOString() };
      }
      return reminder;
    }));

    saveReminders(updatedReminders);
  }
};
