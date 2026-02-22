
// Mock service for searching chat messages
export const chatSearchService = {
  searchMessages: async (conversationId, query) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
    
    const messages = JSON.parse(localStorage.getItem('munal_messages') || '[]');
    const conversationMessages = messages.filter(m => m.conversation_id === conversationId);
    
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return conversationMessages.filter(msg => 
      msg.content && msg.content.toLowerCase().includes(lowerQuery)
    );
  }
};
