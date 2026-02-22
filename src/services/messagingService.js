import { v4 as uuidv4 } from 'uuid';
import { demoUsers } from '@/data/demoUsers';

const MESSAGES_KEY = 'munal_workspace_messages';
const CHANNEL_NAME = 'munal_chat_events';

// Initialize BroadcastChannel for real-time simulation across tabs
const chatChannel = new BroadcastChannel(CHANNEL_NAME);

export const messagingService = {
  // --- Message Persistence ---
  
  async getMessages(user1Id, user2Id) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 300));
    
    const allMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    
    // Filter messages between these two users
    return allMessages.filter(msg => 
      (msg.senderId === user1Id && msg.receiverId === user2Id) ||
      (msg.senderId === user2Id && msg.receiverId === user1Id)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  async sendMessage(senderId, receiverId, content) {
    await new Promise(r => setTimeout(r, 200));
    
    const newMessage = {
      id: uuidv4(),
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    const allMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    allMessages.push(newMessage);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));

    // Notify other tabs/components
    chatChannel.postMessage({ type: 'NEW_MESSAGE', payload: newMessage });

    return newMessage;
  },

  async markAsRead(messageIds) {
    const allMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    let updated = false;

    const newMessages = allMessages.map(msg => {
      if (messageIds.includes(msg.id) && !msg.isRead) {
        updated = true;
        return { ...msg, isRead: true };
      }
      return msg;
    });

    if (updated) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(newMessages));
      chatChannel.postMessage({ type: 'MESSAGES_READ', payload: messageIds });
    }
  },

  // --- Real-time Events (Typing, Online Status) ---

  sendTypingIndicator(senderId, receiverId, isTyping) {
    chatChannel.postMessage({
      type: 'TYPING_STATUS',
      payload: { senderId, receiverId, isTyping }
    });
  },

  subscribeToEvents(callback) {
    const handler = (event) => {
      callback(event.data);
    };
    chatChannel.addEventListener('message', handler);
    return () => chatChannel.removeEventListener('message', handler);
  },

  // --- User Management ---

  getAllUsers() {
    return demoUsers;
  },

  // Simulate online status (randomized for demo purposes if not set)
  getUserStatus(userId) {
    const user = demoUsers.find(u => u.id === userId);
    return user ? user.status : 'offline';
  }
};