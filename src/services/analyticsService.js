
import { v4 as uuidv4 } from 'uuid';

const ANALYTICS_KEY = 'munal_analytics_events';

const getEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveEvents = (events) => {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
};

export const analyticsService = {
  trackEvent: (eventName, metadata = {}) => {
    const events = getEvents();
    const newEvent = {
      id: uuidv4(),
      event: eventName,
      ...metadata,
      timestamp: new Date().toISOString()
    };
    
    // Keep only last 10000 events to prevent quota issues
    if (events.length > 10000) {
        events.shift();
    }
    
    events.push(newEvent);
    saveEvents(events);
    // console.log(`[Analytics] Tracked: ${eventName}`, metadata);
    return newEvent;
  },

  getEvents: (filters = {}) => {
    let events = getEvents();
    
    if (filters.startDate) {
      events = events.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      events = events.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
    }
    if (filters.event) {
      events = events.filter(e => e.event === filters.event);
    }
    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }

    return events;
  },
  
  // Helper to get raw data for other services
  getAllEvents: () => getEvents()
};
