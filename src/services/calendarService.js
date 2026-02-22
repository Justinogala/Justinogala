
import { v4 as uuidv4 } from 'uuid';

const EVENTS_KEY = 'munal_calendar_events';

const getEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveEvents = (events) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export const calendarService = {
  getEvents: (filters = {}) => {
    let events = getEvents();
    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId || (e.attendees && e.attendees.some(a => a.userId === filters.userId)));
    }
    // Add date range filters if needed
    return events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  },

  getEventById: (id) => {
    return getEvents().find(e => e.id === id);
  },

  createEvent: (eventData) => {
    const events = getEvents();
    
    // Basic conflict check
    const hasConflict = events.some(e => {
       if (e.userId !== eventData.userId) return false;
       const start = new Date(e.startTime).getTime();
       const end = new Date(e.endTime).getTime();
       const newStart = new Date(eventData.startTime).getTime();
       const newEnd = new Date(eventData.endTime).getTime();
       
       return (newStart >= start && newStart < end) || (newEnd > start && newEnd <= end);
    });

    const newEvent = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...eventData,
      hasConflict
    };

    events.push(newEvent);
    saveEvents(events);
    return newEvent;
  },

  updateEvent: (id, updates) => {
    const events = getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Event not found");

    events[index] = { ...events[index], ...updates, updatedAt: new Date().toISOString() };
    saveEvents(events);
    return events[index];
  },

  deleteEvent: (id) => {
    const events = getEvents();
    const filtered = events.filter(e => e.id !== id);
    saveEvents(filtered);
  },

  getAvailableSlots: (date, userId) => {
    // Simplified logic: Returns slots between 9am-5pm not taken
    const dayStart = new Date(date); 
    dayStart.setHours(9,0,0,0);
    const dayEnd = new Date(date);
    dayEnd.setHours(17,0,0,0);
    
    const events = calendarService.getEvents({ userId }).filter(e => {
        const eTime = new Date(e.startTime);
        return eTime.getDate() === dayStart.getDate();
    });

    // This is just a placeholder for complex slot calculation
    return [
      { start: dayStart.toISOString(), end: dayEnd.toISOString(), available: true }
    ]; 
  }
};
