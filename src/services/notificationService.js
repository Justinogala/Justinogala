
import { v4 as uuidv4 } from 'uuid';

const NOTIFICATIONS_KEY = 'munal_notifications';

// Simple Event Emitter for real-time updates across tabs/components
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  
  off(event, listenerToRemove) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listenerToRemove);
  }
  
  emit(event, payload) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(payload));
  }
}

export const notificationEvents = new EventEmitter();

// Helper to get from local storage
const getStore = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

// Helper to save to local storage
const saveStore = (notifications) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  notificationEvents.emit('change', notifications);
};

export const notificationService = {
  /**
   * Create a new notification
   * @param {Object} data - { type, title, message, actionUrl, icon, color }
   */
  createNotification: (data) => {
    const notifications = getStore();
    
    // Structure: { id, type, title, message, timestamp, read, actionUrl, icon, color }
    const newNotification = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
      type: data.type || 'system', // 'transcription', 'billing', 'system', 'account', 'plan_limit'
      title: data.title || 'Notification',
      message: data.message || '',
      actionUrl: data.actionUrl || null,
      icon: data.icon || null, // Can be string identifier for component to resolve
      color: data.color || null, // Can be tailwind class or hex
    };

    notifications.unshift(newNotification);
    saveStore(notifications);
    return newNotification;
  },

  notifyAdminOfContactSubmission: (messageData) => {
     return notificationService.createNotification({
        type: 'system',
        title: 'New Contact Inquiry',
        message: `From: ${messageData.name} - ${messageData.subject}`,
        actionUrl: '/admin/messages',
        icon: 'Mail',
        color: 'bg-indigo-500'
     });
  },

  getNotifications: () => {
    return getStore();
  },

  getUnreadCount: () => {
    const notifications = getStore();
    return notifications.filter(n => !n.read).length;
  },

  markAsRead: (id) => {
    const notifications = getStore();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      saveStore(notifications);
    }
  },
  
  toggleReadStatus: (id) => {
    const notifications = getStore();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = !notifications[index].read;
      saveStore(notifications);
    }
  },

  markAllAsRead: () => {
    const notifications = getStore();
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveStore(updated);
  },
  
  // Specific method to clear notifications of a certain type (e.g., when visiting dashboard)
  markTypeAsRead: (type) => {
    const notifications = getStore();
    let changed = false;
    const updated = notifications.map(n => {
      if (n.type === type && !n.read) {
        changed = true;
        return { ...n, read: true };
      }
      return n;
    });
    if (changed) saveStore(updated);
  },

  deleteNotification: (id) => {
    const notifications = getStore();
    const filtered = notifications.filter(n => n.id !== id);
    saveStore(filtered);
  },

  clearAll: () => {
    saveStore([]);
  },
  
  // Subscribe to changes
  subscribe: (callback) => {
    notificationEvents.on('change', callback);
    return () => notificationEvents.off('change', callback);
  }
};
