
import { v4 as uuidv4 } from 'uuid';

// Mock service
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const emailService = {
  sendInvitation: async (meeting, attendees) => {
    await delay(500);
    console.log(`[EmailService] Sending invitations for "${meeting.title}" to`, attendees);
    
    // Generate mock ICS content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${meeting.title}
DTSTART:${new Date(meeting.startTime).toISOString()}
DTEND:${new Date(meeting.endTime).toISOString()}
DESCRIPTION:${meeting.description}
LOCATION:${meeting.location || 'Virtual'}
END:VEVENT
END:VCALENDAR`;

    return { 
      success: true, 
      sentCount: attendees.length,
      icsAttachment: icsContent
    };
  },

  sendUpdate: async (meeting, attendees, changes) => {
    await delay(300);
    console.log(`[EmailService] Sending updates for "${meeting.title}"`, changes);
    return { success: true };
  },

  sendCancellation: async (meeting, attendees) => {
    await delay(300);
    console.log(`[EmailService] Sending cancellation for "${meeting.title}"`);
    return { success: true };
  },

  sendReminder: async (meeting, attendee) => {
    await delay(200);
    console.log(`[EmailService] Sending reminder to ${attendee.email} for "${meeting.title}"`);
    return { success: true };
  }
};
