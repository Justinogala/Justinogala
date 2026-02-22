
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from '@/services/notificationService';

const MESSAGES_KEY = 'munal_admin_messages';

const INITIAL_MOCK_MESSAGES = [
  {
    id: 'msg_1',
    senderId: 'user_1',
    senderName: 'Alice Johnson',
    senderEmail: 'alice@example.com',
    senderAvatar: null,
    subject: 'Question about Enterprise Plan',
    content: 'Hi, I was wondering if the Enterprise plan supports custom SSO integration? We are a team of 50.',
    status: 'unread', // read, unread, archived
    source: 'dashboard', // dashboard, contact_form
    isFlagged: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    replies: []
  },
  {
    id: 'msg_2',
    senderId: 'user_2',
    senderName: 'Bob Smith',
    senderEmail: 'bob.smith@company.com',
    senderAvatar: null,
    subject: 'Billing Issue',
    content: 'I was charged twice for this month. Can you please check?',
    status: 'unread',
    source: 'dashboard',
    isFlagged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    replies: []
  },
  {
    id: 'msg_3',
    senderId: 'user_3',
    senderName: 'Charlie Brown',
    senderEmail: 'charlie@gmail.com',
    senderAvatar: null,
    subject: 'Feature Request: Dark Mode export',
    content: 'It would be great if we could export the PDFs in dark mode as well.',
    status: 'read',
    source: 'dashboard',
    isFlagged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    replies: [
      {
        id: 'reply_1',
        sender: 'Admin',
        content: 'Thanks for the suggestion, Charlie! We are adding this to our roadmap.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString()
      }
    ]
  },
  {
    id: 'msg_4',
    senderId: 'user_4',
    senderName: 'Diana Prince',
    senderEmail: 'diana@themyscira.com',
    senderAvatar: null,
    subject: 'Account Deletion',
    content: 'Please delete my account and all associated data.',
    status: 'archived',
    source: 'dashboard',
    isFlagged: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    replies: []
  }
];

// Helper to simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const adminMessageService = {
  // Initialize or get messages
  _getStore: () => {
    try {
      const data = localStorage.getItem(MESSAGES_KEY);
      if (data) return JSON.parse(data);
      
      // Initialize if empty
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MOCK_MESSAGES));
      return INITIAL_MOCK_MESSAGES;
    } catch (e) {
      console.error("Error accessing message store", e);
      return [];
    }
  },

  _saveStore: (messages) => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    // Dispatch storage event to sync across tabs
    window.dispatchEvent(new Event('storage'));
  },

  getMessages: async ({ page = 1, limit = 10, search = '', status = 'all' }) => {
    await delay(600);
    let messages = adminMessageService._getStore();

    // 1. Filter by status
    if (status !== 'all') {
      if (status === 'flagged') {
        messages = messages.filter(m => m.isFlagged);
      } else {
        messages = messages.filter(m => m.status === status);
      }
    }

    // 2. Search
    if (search) {
      const lowerSearch = search.toLowerCase();
      messages = messages.filter(m => 
        m.senderName.toLowerCase().includes(lowerSearch) ||
        m.subject.toLowerCase().includes(lowerSearch) ||
        m.content.toLowerCase().includes(lowerSearch) ||
        m.senderEmail.toLowerCase().includes(lowerSearch)
      );
    }

    // 3. Sort (Newest first)
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 4. Pagination
    const total = messages.length;
    const start = (page - 1) * limit;
    const paginatedMessages = messages.slice(start, start + limit);

    return {
      messages: paginatedMessages,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },

  getMessageById: async (id) => {
    await delay(300);
    const messages = adminMessageService._getStore();
    return messages.find(m => m.id === id);
  },

  saveContactFormMessage: async (formData) => {
    await delay(800);
    const messages = adminMessageService._getStore();
    
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: 'guest_' + Math.random().toString(36).substr(2, 9),
      senderName: formData.name,
      senderEmail: formData.email,
      senderAvatar: null,
      subject: formData.subject,
      content: formData.message,
      status: 'unread',
      source: 'contact_form',
      isFlagged: false,
      createdAt: new Date().toISOString(),
      replies: []
    };

    messages.unshift(newMessage);
    adminMessageService._saveStore(messages);

    // Trigger notification for admin
    notificationService.createNotification({
      type: 'system',
      title: 'New Contact Form Submission',
      message: `From: ${formData.name} - ${formData.subject}`,
      actionUrl: '/admin/messages',
      icon: 'MessageSquare',
      color: 'bg-blue-500'
    });

    return newMessage;
  },

  markAsRead: async (id) => {
    await delay(300);
    const messages = adminMessageService._getStore();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].status = 'read';
      messages[index].updatedAt = new Date().toISOString();
      adminMessageService._saveStore(messages);
      return messages[index];
    }
    throw new Error('Message not found');
  },

  markAsUnread: async (id) => {
    await delay(300);
    const messages = adminMessageService._getStore();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].status = 'unread';
      messages[index].updatedAt = new Date().toISOString();
      adminMessageService._saveStore(messages);
      return messages[index];
    }
    throw new Error('Message not found');
  },

  archiveMessage: async (id) => {
    await delay(300);
    const messages = adminMessageService._getStore();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].status = 'archived';
      messages[index].archivedAt = new Date().toISOString();
      adminMessageService._saveStore(messages);
      return messages[index];
    }
    throw new Error('Message not found');
  },

  deleteMessage: async (id) => {
    await delay(400);
    let messages = adminMessageService._getStore();
    messages = messages.filter(m => m.id !== id);
    adminMessageService._saveStore(messages);
    return true;
  },

  toggleFlag: async (id) => {
    await delay(200);
    const messages = adminMessageService._getStore();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].isFlagged = !messages[index].isFlagged;
      adminMessageService._saveStore(messages);
      return messages[index];
    }
    throw new Error('Message not found');
  },

  replyToMessage: async (id, replyContent) => {
    await delay(800);
    const messages = adminMessageService._getStore();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      const reply = {
        id: uuidv4(),
        sender: 'Admin',
        content: replyContent,
        createdAt: new Date().toISOString()
      };
      
      if (!messages[index].replies) messages[index].replies = [];
      messages[index].replies.push(reply);
      messages[index].status = 'read'; // Auto mark as read on reply
      messages[index].updatedAt = new Date().toISOString();
      
      adminMessageService._saveStore(messages);
      return messages[index];
    }
    throw new Error('Message not found');
  },
  
  syncWithUsers: (users) => {
    const messages = adminMessageService._getStore();
    let updated = false;
    
    messages.forEach(msg => {
      // Only sync for registered users, not guest contact form messages
      if (msg.source !== 'contact_form') {
        const user = users.find(u => u.id === msg.senderId);
        if (user) {
          if (msg.senderName !== user.name || msg.senderEmail !== user.email) {
            msg.senderName = user.name;
            msg.senderEmail = user.email;
            updated = true;
          }
        }
      }
    });

    if (updated) {
      adminMessageService._saveStore(messages);
    }
  }
};
