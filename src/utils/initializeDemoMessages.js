
import { demoMessages } from '@/data/demoMessages';

const STORAGE_KEY = 'munal_demo_chat_messages';

export const initializeDemoMessages = () => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    
    // Always refresh if key doesn't exist, or if we want to force sync
    if (!existing) {
      console.log('Initializing demo chat messages...');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoMessages));
      return { success: true, message: 'Demo messages initialized' };
    }
    
    return { success: true, message: 'Demo messages already exist' };
  } catch (error) {
    console.error('Failed to initialize demo messages:', error);
    // Return success: false but don't throw
    return { success: false, error: error.message };
  }
};

export const getStoredMessages = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve messages:', error);
    return [];
  }
};
