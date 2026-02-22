import { API_CONFIG } from '@/config/apiConfig';
import { transcriptionConfigService } from '@/services/transcriptionConfigService';
import { MUNAL_AI_SYSTEM_PROMPT } from '@/data/munalAISystemPrompt';

export const munalAIChatService = {
  /**
   * Sends a message to OpenAI API and streams the response.
   * @param {Array} messages - Array of message objects { role, content }
   * @param {Function} onChunk - Callback for each stream chunk
   * @param {Function} onComplete - Callback when stream completes
   * @param {Function} onError - Callback for errors
   */
  sendMessageStream: async (messages, onChunk, onComplete, onError) => {
    try {
      // 1. Try to get key from user settings (transcriptionConfigService)
      // 2. Fallback to environment variable (API_CONFIG)
      let apiKey = transcriptionConfigService.getOpenAIApiKey();
      
      if (!apiKey || apiKey.trim() === '') {
        apiKey = API_CONFIG.OPENAI_API_KEY;
      }

      if (!apiKey) {
        throw new Error('OpenAI API key is missing. Please configure it in Settings > API Keys.');
      }

      if (!apiKey.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key format. Key should start with "sk-".');
      }

      // Prepare conversation with system prompt
      const conversation = [
        { role: 'system', content: MUNAL_AI_SYSTEM_PROMPT },
        ...messages
      ];

      const response = await fetch(API_CONFIG.GPT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Cost-effective and fast for chat widgets
          messages: conversation,
          stream: true,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
           throw new Error('Invalid API Key. Please check your settings.');
        }
        if (response.status === 429) {
           throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
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
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.replace('data: ', ''));
              const content = data.choices[0]?.delta?.content;
              
              if (content) {
                fullResponse += content;
                if (onChunk) onChunk(content);
              }
            } catch (e) {
              console.warn('Error parsing stream chunk', e);
            }
          }
        }
      }

      if (onComplete) onComplete(fullResponse);

    } catch (error) {
      console.error('Munal AI Chat Error:', error);
      if (onError) onError(error.message);
    }
  }
};