
/**
 * Service to manage transcription provider configurations and API keys.
 * Uses localStorage for persistence in this frontend-only environment.
 */

const STORAGE_KEY = 'echonote_transcription_config';

const defaultProviders = {
  openai: {
    id: 'openai',
    name: 'OpenAI Whisper',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    enabled: true,
    status: 'active', 
    lastTested: null,
    tier: 'Pay-as-you-go',
    limits: '25MB file size limit',
    options: {
      model: 'whisper-1',
      language: 'auto',
      temperature: 0
    }
  },
  assemblyai: {
    id: 'assemblyai',
    name: 'AssemblyAI',
    apiKey: '',
    enabled: false,
    status: 'inactive',
    lastTested: null,
    tier: 'Free',
    limits: 'Unknown',
    options: {}
  },
  google: {
    id: 'google',
    name: 'Google Cloud Speech-to-Text',
    apiKey: '',
    enabled: false,
    status: 'inactive',
    lastTested: null,
    tier: 'Enterprise',
    limits: 'Unknown',
    options: {}
  }
};

export const transcriptionConfigService = {
  // Initialize storage if empty
  init: () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProviders));
    }
  },

  getAllConfigs: () => {
    transcriptionConfigService.init();
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      // Merge with default structure to ensure new fields (like options) exist if storage is old
      return {
        ...defaultProviders,
        ...stored,
        openai: { ...defaultProviders.openai, ...stored?.openai },
        assemblyai: { ...defaultProviders.assemblyai, ...stored?.assemblyai },
        google: { ...defaultProviders.google, ...stored?.google }
      };
    } catch (e) {
      return defaultProviders;
    }
  },

  getProviderConfig: (providerId) => {
    const configs = transcriptionConfigService.getAllConfigs();
    return configs[providerId] || defaultProviders[providerId];
  },

  saveAPIKey: (providerId, apiKey) => {
    const configs = transcriptionConfigService.getAllConfigs();
    if (configs[providerId]) {
      // Simple base64 encoding to avoid plain text in storage (NOT secure encryption)
      // If key is already similar to existing one or empty, just save it
      configs[providerId].apiKey = apiKey.startsWith('sk-') ? btoa(apiKey) : apiKey;
      configs[providerId].status = 'active'; 
      configs[providerId].enabled = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      return true;
    }
    return false;
  },
  
  saveProviderSettings: (providerId, settings) => {
    const configs = transcriptionConfigService.getAllConfigs();
    if (configs[providerId]) {
      configs[providerId] = {
        ...configs[providerId],
        ...settings
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      return true;
    }
    return false;
  },

  getAPIKey: (providerId) => {
    const config = transcriptionConfigService.getProviderConfig(providerId);
    
    // Check if we have a stored key
    if (config && config.apiKey) {
      try {
        const decoded = atob(config.apiKey);
        if (decoded && decoded.startsWith('sk-')) return decoded;
        return config.apiKey; // Return as is if not base64 or doesn't match pattern
      } catch (e) {
        return config.apiKey;
      }
    }
    
    // Fallback to env var if it matches the provider and no stored key
    if (providerId === 'openai' && import.meta.env.VITE_OPENAI_API_KEY) {
      return import.meta.env.VITE_OPENAI_API_KEY;
    }

    return '';
  },

  // Specific helpers for OpenAI
  getOpenAIApiKey: () => {
    return transcriptionConfigService.getAPIKey('openai');
  },

  getOpenAIConfig: () => {
    return transcriptionConfigService.getProviderConfig('openai');
  },

  validateOpenAIApiKey: () => {
    const key = transcriptionConfigService.getOpenAIApiKey();
    return !!(key && key.startsWith('sk-'));
  },
  
  testConnection: async (providerId) => {
    const apiKey = transcriptionConfigService.getAPIKey(providerId);
    if (!apiKey) throw new Error("API Key is missing");
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (providerId === 'openai') {
      if (!apiKey.startsWith('sk-')) throw new Error("Invalid OpenAI API Key format");
      // In a real app, we would make a fetch call to https://api.openai.com/v1/models
      // to verify the key. For this demo, we simulate success if format is correct.
      return { success: true };
    }
    
    return { success: true };
  },

  updateProviderStatus: (providerId, status, extraData = {}) => {
    const configs = transcriptionConfigService.getAllConfigs();
    if (configs[providerId]) {
      configs[providerId].status = status;
      if (status === 'active') {
        configs[providerId].enabled = true;
        configs[providerId].lastTested = new Date().toISOString();
      }
      Object.assign(configs[providerId], extraData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    }
  },

  toggleProvider: (providerId, enabled) => {
    const configs = transcriptionConfigService.getAllConfigs();
    if (configs[providerId]) {
      configs[providerId].enabled = enabled;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    }
  }
};
