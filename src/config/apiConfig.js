
export const API_CONFIG = {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  WHISPER_API_ENDPOINT: 'https://api.openai.com/v1/audio/transcriptions',
  GPT_API_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  DEFAULT_HEADERS: {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
  },
  TIMEOUTS: {
    TRANSCRIPTION: 300000, // 5 minutes (large audio files might take time)
    GPT: 60000, // 1 minute
  },
  RATE_LIMIT: {
    MAX_CONCURRENT: 3,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_FACTOR: 1.5,
  },
};

export const validateApiKey = () => {
  const key = API_CONFIG.OPENAI_API_KEY;
  return key && key.startsWith('sk-');
};

export const getHeaders = (isMultipart = false) => {
  const headers = {
    'Authorization': `Bearer ${API_CONFIG.OPENAI_API_KEY}`,
  };
  
  // For multipart/form-data (file upload), we let the browser set Content-Type
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

export const getTimeout = (type) => {
  return API_CONFIG.TIMEOUTS[type] || 30000;
};
