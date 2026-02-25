const API_URL = import.meta.env.REACT_APP_BACKEND_URL || window.location.origin;

export const munalAIChatService = {
  /**
   * Sends a message to the AI backend and streams the response.
   * Uses Emergent LLM Key via backend - no user API key needed.
   * @param {Array} messages - Array of message objects { role, content }
   * @param {Function} onChunk - Callback for each stream chunk
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   */
  sendMessageStream: async (messages, onChunk, onComplete, onError) => {
    try {
      const response = await fetch(`${API_URL}/api/ai/chat/stream`, {
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

      if (!response.body) {
        throw new Error('Streaming not supported in this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(trimmedLine.replace('data: ', ''));
            
            if (data.chunk) {
              fullResponse += data.chunk;
              if (onChunk) onChunk(data.chunk);
            }
            
            if (data.done) {
              if (onComplete) onComplete(data.full_response || fullResponse);
              return;
            }
          } catch (e) {
            console.warn('Error parsing stream chunk', e);
          }
        }
      }

      if (onComplete) onComplete(fullResponse);

    } catch (error) {
      console.error('Munal AI Chat Error:', error);
      if (onError) onError(error.message);
    }
  },

  /**
   * Send a non-streaming chat message
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
