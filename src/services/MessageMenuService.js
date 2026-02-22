
import { messagingService } from '@/services/messagingService';

export const MessageMenuService = {
  // Delete Message
  deleteMessage: async (messageId) => {
    try {
      await messagingService.deleteMessage(messageId);
      return { success: true };
    } catch (error) {
      console.error('Delete message failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Edit Message
  editMessage: async (messageId, newContent) => {
    try {
      const updatedMessage = await messagingService.updateMessage(messageId, { content: newContent });
      return { success: true, message: updatedMessage };
    } catch (error) {
      console.error('Edit message failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Pin/Unpin Message
  togglePin: async (messageId) => {
    try {
      const updatedMessage = await messagingService.togglePinMessage(messageId);
      return { success: true, message: updatedMessage, isPinned: updatedMessage.isPinned };
    } catch (error) {
      console.error('Toggle pin failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Forward Message
  forwardMessage: async (originalMessage, targetConversationIds, currentUserId, currentUserName) => {
    try {
      // Handle multiple destinations
      const promises = targetConversationIds.map(convId => 
        messagingService.sendMessage(
          convId,
          currentUserId,
          originalMessage.content,
          currentUserName,
          originalMessage.attachments || [],
          originalMessage.sender_name // forwardedFrom
        )
      );
      
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Forward message failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Add/Remove Reaction
  toggleReaction: async (messageId, userId, emoji) => {
    try {
      const updatedMessage = await messagingService.reactToMessage(messageId, userId, emoji);
      return { success: true, message: updatedMessage };
    } catch (error) {
      console.error('Reaction failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Report Message
  reportMessage: async (messageId, userId, reason, description) => {
    try {
      await messagingService.reportMessage(messageId, userId, reason, description);
      return { success: true };
    } catch (error) {
      console.error('Report failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Copy Content
  copyContent: (content) => {
    try {
      navigator.clipboard.writeText(content);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Clipboard access denied' };
    }
  },
  
  // Archive Message (Mock - hiding locally)
  archiveMessage: async (messageId) => {
    try {
        // For now we just use a local flag or update status
        await messagingService.updateMessage(messageId, { status: 'archived' });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
  }
};
