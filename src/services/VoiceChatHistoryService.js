
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'munal_voice_chat_history';

class VoiceChatHistoryService {
  constructor() {
    this.listeners = new Set();
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notify() {
    this.listeners.forEach(listener => listener());
  }

  // Get all history
  getHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse voice chat history:', error);
      return [];
    }
  }

  // Add a new conversation
  addConversation(data) {
    try {
      const history = this.getHistory();
      const newConversation = {
        id: uuidv4(),
        userId: data.userId || 'guest',
        userName: data.userName || 'Unknown User',
        userEmail: data.userEmail || '',
        userAvatar: data.userAvatar || '',
        transcript: data.transcript || '',
        duration: data.duration || 0,
        timestamp: new Date().toISOString(),
        ...data
      };

      const updatedHistory = [newConversation, ...history];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      this.notify();
      return newConversation;
    } catch (error) {
      console.error('Failed to add conversation:', error);
      return null;
    }
  }

  // Delete a specific conversation
  deleteConversation(id) {
    try {
      const history = this.getHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      this.notify();
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  // Clear all history
  clearAllHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.notify();
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  // Get statistics
  getStats() {
    const history = this.getHistory();
    const totalConversations = history.length;
    const totalDuration = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    
    // Find most frequent contact
    const contactCounts = {};
    history.forEach(item => {
      if (item.userName) {
        contactCounts[item.userName] = (contactCounts[item.userName] || 0) + 1;
      }
    });
    
    let mostFrequentContact = 'None';
    let maxCount = 0;
    
    Object.entries(contactCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentContact = name;
      }
    });

    return {
      totalConversations,
      totalDuration,
      mostFrequentContact
    };
  }
}

export const voiceChatHistoryService = new VoiceChatHistoryService();
