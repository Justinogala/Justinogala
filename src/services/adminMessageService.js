
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

export const adminMessageService = {
  // Get all internal messages
  getMessages: async ({ page = 1, limit = 20, search = '', status = 'all' }) => {
    try {
      const skip = (page - 1) * limit;
      const response = await fetch(
        `${API_URL}/api/admin/internal-messages?limit=${limit}&skip=${skip}&status=${status}`
      );
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch messages');
      }
      
      // Filter by search if provided
      let messages = data.messages;
      if (search) {
        const searchLower = search.toLowerCase();
        messages = messages.filter(msg => 
          msg.subject?.toLowerCase().includes(searchLower) ||
          msg.content?.toLowerCase().includes(searchLower) ||
          msg.sender_name?.toLowerCase().includes(searchLower) ||
          msg.recipient_name?.toLowerCase().includes(searchLower)
        );
      }
      
      return {
        messages: messages.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name || 'Unknown',
          senderEmail: data.users[msg.sender_id]?.email || '',
          senderAvatar: data.users[msg.sender_id]?.avatar || null,
          recipientId: msg.recipient_id,
          recipientName: msg.recipient_name || 'Unknown',
          recipientEmail: data.users[msg.recipient_id]?.email || '',
          subject: msg.subject,
          content: msg.content,
          status: msg.in_trash ? 'archived' : (msg.is_read ? 'read' : 'unread'),
          source: 'internal',
          isFlagged: msg.is_starred || false,
          isDraft: msg.is_draft || false,
          isJunk: msg.is_junk || false,
          inTrash: msg.in_trash || false,
          attachments: msg.attachments || [],
          createdAt: msg.created_at,
          replies: []
        })),
        total: data.total,
        totalPages: Math.ceil(data.total / limit),
        counts: data.counts
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Get message detail with thread
  getMessageDetail: async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/internal-messages/${messageId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch message');
      }
      
      return {
        message: data.message,
        thread: data.thread,
        users: data.users,
        attachments: data.attachments
      };
    } catch (error) {
      console.error('Error fetching message detail:', error);
      throw error;
    }
  },

  // Mark as read (using the messages API)
  markAsRead: async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/read/${messageId}`, {
        method: 'PUT'
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  },

  // Mark as unread - not directly supported, would need backend endpoint
  markAsUnread: async (messageId) => {
    // This would need a new backend endpoint
    console.log('Mark as unread not implemented for:', messageId);
    return true;
  },

  // Archive message (move to trash)
  archiveMessage: async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/trash/${messageId}`, {
        method: 'PUT'
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error archiving message:', error);
      throw error;
    }
  },

  // Delete message permanently
  deleteMessage: async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/internal-messages/${messageId}?permanent=true`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Toggle flag/star
  toggleFlag: async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/star/${messageId}`, {
        method: 'PUT'
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error toggling flag:', error);
      throw error;
    }
  },

  // Reply to message - admin would need to be a user to reply
  replyToMessage: async (messageId, content) => {
    // Admin reply functionality would need special handling
    console.log('Admin reply not implemented:', messageId, content);
    return true;
  }
};

export default adminMessageService;
