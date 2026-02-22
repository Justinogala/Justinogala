
// This service handles content generation using OpenAI GPT models

const COMPLETIONS_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Calls OpenAI Chat Completion API
 * @param {Array} messages - Array of message objects
 * @param {string} apiKey - OpenAI API Key
 * @param {string} model - Model to use (default: gpt-3.5-turbo or gpt-4)
 * @returns {Promise<string>} Generated text content
 */
const callOpenAI = async (messages, apiKey, model = 'gpt-3.5-turbo') => {
  if (!apiKey) throw new Error('OpenAI API Key is missing');

  try {
    const response = await fetch(COMPLETIONS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'AI processing failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Processing Error:', error);
    throw error;
  }
};

export const generateSummary = async (transcript, apiKey) => {
  const messages = [
    {
      role: "system",
      content: "You are an expert meeting assistant. Generate a structured summary of the provided meeting transcript. The summary should include an Overview, Key Discussion Points, and Outcomes. Return the result in JSON format with keys: 'overview', 'keyPoints' (array of strings), 'outcomes' (array of strings)."
    },
    {
      role: "user",
      content: transcript
    }
  ];

  const content = await callOpenAI(messages, apiKey);
  try {
    return JSON.parse(content);
  } catch (e) {
    // Fallback if JSON parsing fails, return text structure
    return {
      overview: content,
      keyPoints: [],
      outcomes: []
    };
  }
};

export const extractActionItems = async (transcript, apiKey) => {
  const messages = [
    {
      role: "system",
      content: "Extract action items from the meeting transcript. For each item, identify the task, the owner (if mentioned, otherwise 'Unassigned'), and deadline (if mentioned, otherwise 'No date'). Return a JSON array of objects with keys: 'task', 'owner', 'deadline'."
    },
    {
      role: "user",
      content: transcript
    }
  ];

  const content = await callOpenAI(messages, apiKey);
  try {
    return JSON.parse(content);
  } catch (e) {
    console.warn("Failed to parse action items JSON", e);
    return [];
  }
};

export const extractInsights = async (transcript, apiKey) => {
  const messages = [
    {
      role: "system",
      content: "Analyze the meeting transcript and identify: 1. Key Decisions Made, 2. Risks Identified, 3. Follow-up items. Return a JSON object with keys: 'decisions' (array), 'risks' (array), 'followUps' (array)."
    },
    {
      role: "user",
      content: transcript
    }
  ];

  const content = await callOpenAI(messages, apiKey);
  try {
    return JSON.parse(content);
  } catch (e) {
    console.warn("Failed to parse insights JSON", e);
    return { decisions: [], risks: [], followUps: [] };
  }
};
