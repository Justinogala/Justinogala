
import { API_CONFIG, getHeaders, getTimeout } from '@/config/apiConfig';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeGptRequest = async (messages, model = 'gpt-3.5-turbo') => {
  let attempts = 0;

  const attemptRequest = async () => {
    attempts++;
    try {
      if (!API_CONFIG.OPENAI_API_KEY) {
        console.warn("No API Key found. Using mock summary.");
        await delay(1500);
        return "This is a simulated AI response because no API key is configured. Please add your VITE_OPENAI_API_KEY to test real summarization.";
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), getTimeout('GPT'));

      const response = await fetch(API_CONFIG.GPT_API_ENDPOINT, {
        method: 'POST',
        headers: getHeaders(false),
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error(`GPT attempt ${attempts} failed:`, error);
      if (attempts < API_CONFIG.RETRY.MAX_ATTEMPTS) {
        const waitTime = 1000 * Math.pow(API_CONFIG.RETRY.BACKOFF_FACTOR, attempts);
        await delay(waitTime);
        return attemptRequest();
      }
      throw error;
    }
  };

  return attemptRequest();
};

export const generateSummary = async (transcriptText) => {
  const messages = [
    { role: "system", content: "You are a helpful assistant that summarizes meeting transcripts." },
    { role: "user", content: `Please provide a concise summary of the following transcript:\n\n${transcriptText}` }
  ];
  const result = await makeGptRequest(messages);
  return { text: result, timestamp: new Date().toISOString(), model: 'gpt-3.5-turbo' };
};

export const extractKeyPoints = async (transcriptText) => {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: `Extract the main key points from this transcript as a bulleted list:\n\n${transcriptText}` }
  ];
  const result = await makeGptRequest(messages);
  return { text: result, timestamp: new Date().toISOString(), model: 'gpt-3.5-turbo' };
};

export const extractActionItems = async (transcriptText) => {
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: `Identify and list any action items, tasks, or follow-ups from this transcript. If none, state "No action items detected".\n\n${transcriptText}` }
  ];
  const result = await makeGptRequest(messages);
  return { text: result, timestamp: new Date().toISOString(), model: 'gpt-3.5-turbo' };
};
