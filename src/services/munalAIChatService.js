const API_URL = import.meta.env.REACT_APP_BACKEND_URL;

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
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
          model: 'gpt-4o',
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.response) {
        throw new Error('Invalid response from AI service');
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
      if (onError) onError(error.message);
    }
  },

  /**
   * Send a non-streaming chat message (direct response)
   */
  sendMessage: async (messages) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
          model: 'gpt-4o',
          max_tokens: 1000,
          temperature: 0.7
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
      return { success: false, error: error.message };
    }
  }
};
