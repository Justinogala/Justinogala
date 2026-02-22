
import { persistentSettingsService } from './persistentSettingsService';
import { v4 as uuidv4 } from 'uuid';

const CATEGORY = 'api';
const CONFIG_KEY = 'config';
const API_LOGS_KEY = 'echonote_admin_api_logs'; // Keeping logs separate/flat for now

export const apiConfigService = {
  // Initialize or load default structure
  initialize: () => {
    const existing = persistentSettingsService.loadSettings(CATEGORY, CONFIG_KEY);
    if (!existing) {
      const initialConfig = {
        openai: { 
          key: '', 
          status: 'inactive', // active, inactive, error
          lastTested: null,
          health: 'neutral' 
        },
        googleCloud: { 
          key: '', 
          status: 'inactive',
          lastTested: null,
          health: 'neutral'
        },
        defaults: {
          transcription: 'openai',
          summarization: 'openai'
        },
        usage: {
          openai: { calls: 0, quota: 100, cost: 0 },
          googleCloud: { calls: 0, quota: 300, cost: 0 }
        }
      };
      persistentSettingsService.saveSettings(CATEGORY, CONFIG_KEY, initialConfig);
      return initialConfig;
    }
    return existing;
  },

  getConfig: () => {
    return apiConfigService.initialize();
  },

  saveConfig: (newConfig) => {
    persistentSettingsService.saveSettings(CATEGORY, CONFIG_KEY, newConfig);
    return newConfig;
  },

  getActiveAPIConfig: () => {
    const config = apiConfigService.getConfig();
    return config; // In a real app, this might filter only active keys
  },
  
  isAPIConfigured: (apiName) => {
    const config = apiConfigService.getConfig();
    return config[apiName]?.status === 'active' && !!config[apiName]?.key;
  },

  validateOpenAIKey: async (key) => {
    // Simulated validation
    await new Promise(resolve => setTimeout(resolve, 800));
    if (key && key.startsWith('sk-')) {
      return { valid: true, message: 'OpenAI key validated successfully' };
    }
    return { valid: false, message: 'Invalid OpenAI API key format' };
  },

  validateGoogleCloudKey: async (key) => {
    // Simulated validation
    await new Promise(resolve => setTimeout(resolve, 800));
    if (key && key.length > 20) {
      return { valid: true, message: 'Google Cloud key validated successfully' };
    }
    return { valid: false, message: 'Invalid Google Cloud API key' };
  },

  testConnection: async (provider, key) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 90% success rate simulation
    const success = Math.random() > 0.1; 
    
    if (success) {
      return { 
        success: true, 
        status: 'active', 
        health: 'good',
        usage: { calls: Math.floor(Math.random() * 50), cost: Math.random() * 0.5 } 
      };
    } else {
      return { 
        success: false, 
        status: 'error', 
        health: 'critical', 
        error: 'Connection timed out or unauthorized' 
      };
    }
  },

  logError: (provider, error) => {
    const logs = JSON.parse(localStorage.getItem(API_LOGS_KEY) || '[]');
    const newLog = {
      id: uuidv4(),
      provider,
      timestamp: new Date().toISOString(),
      message: error.message || error,
      code: error.code || 'UNKNOWN_ERROR'
    };
    logs.unshift(newLog);
    // Keep last 50 logs
    if (logs.length > 50) logs.pop();
    localStorage.setItem(API_LOGS_KEY, JSON.stringify(logs));
  },

  getLogs: (limit = 10) => {
    const logs = JSON.parse(localStorage.getItem(API_LOGS_KEY) || '[]');
    return logs.slice(0, limit);
  }
};
