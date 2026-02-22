
import { demoUsers } from '@/data/demoUsers';

// Mock Service for managing Recent Chats
// This service purely formats the demoUsers data into a chat-friendly structure

export const recentChatsService = {
  getRecentChats: async () => {
    // Simulate a tiny network delay for realism, but keep it robust
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Map demoUsers directly to the structure expected by RecentChatList
      // We use the data already embedded in demoUsers.js
      const chats = demoUsers.map(user => {
        return {
          id: `chat_${user.id}`,
          userId: user.id,
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
            online: user.online,
            avatarColor: user.avatarColor,
            status: user.status
          },
          lastMessage: user.lastMessage || {
            content: "Start a conversation",
            timestamp: "Now",
            sender: "system"
          },
          unreadCount: user.unreadCount || 0,
          updatedAt: new Date().toISOString()
        };
      });

      return chats;
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      // Fallback to empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  deleteChat: async (chatId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Deleted chat ${chatId}`);
    return true;
  },

  archiveChat: async (chatId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`Archived chat ${chatId}`);
    return true;
  }
};
