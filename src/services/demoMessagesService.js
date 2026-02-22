
import { demoMessages } from '@/data/demoMessages';
import { initializeDemoMessages } from '@/utils/initializeDemoMessages';

// NOTE: This service mocks Supabase functionality using localStorage
// because Supabase is not currently connected.
// In production, these methods would be replaced with actual Supabase client calls.

const STORAGE_KEY = 'munal_demo_chat_messages';

export const demoMessagesService = {
  // Initialize data
  init: () => {
    initializeDemoMessages();
  },

  // Fetch all messages (simulating Supabase select)
  getMessages: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const messages = stored ? JSON.parse(stored) : [];
      
      // Sort by timestamp desc
      return messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Service error:', error);
      return [];
    }
  },

  // Mark message as read (simulating Supabase update)
  markAsRead: async (messageId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let messages = stored ? JSON.parse(stored) : [];
      
      messages = messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('Service error:', error);
      return false;
    }
  },

  // Delete message (simulating Supabase delete)
  deleteMessage: async (messageId) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let messages = stored ? JSON.parse(stored) : [];
      
      messages = messages.filter(msg => msg.id !== messageId);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('Service error:', error);
      return false;
    }
  },

  // Filter messages based on criteria
  filterMessages: (messages, criteria) => {
    return messages.filter(msg => {
      // Search filter
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        const matchesSearch = 
          msg.content.toLowerCase().includes(query) ||
          msg.senderName.toLowerCase().includes(query) ||
          msg.senderEmail.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (criteria.status && criteria.status !== 'all') {
        const isRead = criteria.status === 'read';
        if (msg.isRead !== isRead) return false;
      }

      // Role filter
      if (criteria.role && criteria.role !== 'all') {
        if (msg.role.toLowerCase() !== criteria.role.toLowerCase()) return false;
      }

      // Time range filter
      if (criteria.timeRange && criteria.timeRange !== 'all') {
        const msgDate = new Date(msg.timestamp);
        const now = new Date();
        const diffHours = (now - msgDate) / (1000 * 60 * 60);
        
        if (criteria.timeRange === 'today' && diffHours > 24) return false;
        if (criteria.timeRange === 'week' && diffHours > 24 * 7) return false;
        if (criteria.timeRange === 'month' && diffHours > 24 * 30) return false;
      }

      return true;
    });
  }
};
