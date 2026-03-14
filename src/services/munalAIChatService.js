import { getApiUrl, API_URL } from '@/lib/api';

export const munalAIChatService = {
  /**
   * Sends a message to the AI backend.
   * Uses Emergent LLM Key via backend - no user API key needed.
   * @param {Array} messages - Array of message objects { role, content }
   * @param {Function} onChunk - Callback for simulated streaming chunks
   * @param {Function} onComplete - Callback when response is ready
   * @param {Function} onError - Callback for errors
   */
  sendMessageStream: async (messages, onChunk, onComplete, onError) => {
    const apiUrl = API_URL || window.location.origin;
    console.log('Munal AI Chat - API URL:', apiUrl);
    
    try {
      // Extract the last user message and build conversation history
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const conversationHistory = messages.slice(0, -1).map(({ role, content }) => ({ role, content }));
      
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastUserMessage?.content || '',
          conversation_history: conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.response) {
        throw new Error(data.detail || 'Invalid response from AI service');
      }

      // Simulate streaming by sending response in chunks for better UX
      const fullResponse = data.response;
      const words = fullResponse.split(' ');
      let currentIndex = 0;
      
      const streamInterval = setInterval(() => {
        if (currentIndex < words.length) {
          const chunk = words[currentIndex] + (currentIndex < words.length - 1 ? ' ' : '');
          if (onChunk) onChunk(chunk);
          currentIndex++;
        } else {
          clearInterval(streamInterval);
          if (onComplete) onComplete(fullResponse);
        }
      }, 30); // ~30ms per word for natural typing effect

    } catch (error) {
      console.error('Munal AI Chat Error:', error);
      if (onError) onError(error.message || 'Failed to get response');
    }
  },

  /**
   * Send a non-streaming chat message (direct response)
   */
  sendMessage: async (messages) => {
    const apiUrl = API_URL || window.location.origin;
    
    try {
      // Extract the last user message and build conversation history
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      const conversationHistory = messages.slice(0, -1).map(({ role, content }) => ({ role, content }));
      
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastUserMessage?.content || '',
          conversation_history: conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, response: data.response };
    } catch (error) {
      console.error('Munal AI Chat Error:', error);
      return { success: false, error: error.message || 'Failed to get response' };
    }
  }
};
