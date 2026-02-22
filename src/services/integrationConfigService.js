
import { persistentSettingsService } from './persistentSettingsService';
import { v4 as uuidv4 } from 'uuid';

const CATEGORY = 'integration';
const CONFIG_KEY = 'config';
const INT_LOGS_KEY = 'echonote_admin_int_logs';

export const integrationConfigService = {
  initialize: () => {
    const existing = persistentSettingsService.loadSettings(CATEGORY, CONFIG_KEY);
    if (!existing) {
      const initialConfig = {
        slack: { enabled: false, status: 'disconnected', lastUsed: null, credentials: {} },
        googleDrive: { enabled: false, status: 'disconnected', lastUsed: null, credentials: {} },
        dropbox: { enabled: false, status: 'disconnected', lastUsed: null, credentials: {} },
        teams: { enabled: false, status: 'disconnected', lastUsed: null, credentials: {} },
        zapier: { enabled: false, status: 'disconnected', lastUsed: null, credentials: {} }
      };
      persistentSettingsService.saveSettings(CATEGORY, CONFIG_KEY, initialConfig);
      return initialConfig;
    }
    return existing;
  },

  getConfig: () => {
    return integrationConfigService.initialize();
  },

  saveConfig: (newConfig) => {
    persistentSettingsService.saveSettings(CATEGORY, CONFIG_KEY, newConfig);
    return newConfig;
  },
  
  getIntegrationConfig: (integrationName) => {
    const config = integrationConfigService.getConfig();
    return config[integrationName];
  },

  isIntegrationConfigured: (integrationName) => {
    const config = integrationConfigService.getConfig();
    const int = config[integrationName];
    return int && int.enabled && int.status === 'connected';
  },

  testConnection: async (type) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    const success = Math.random() > 0.2;
    if (success) {
      return { success: true, status: 'connected', message: 'Connected successfully' };
    }
    return { success: false, status: 'error', message: 'Failed to authenticate' };
  },

  getStats: () => {
    // Mock stats
    return {
      slack: { exports: 124, successRate: 98 },
      googleDrive: { exports: 85, successRate: 95 },
      dropbox: { exports: 42, successRate: 92 },
      teams: { exports: 15, successRate: 88 },
      zapier: { exports: 210, successRate: 99 }
    };
  },

  logEvent: (type, status, message) => {
    const logs = JSON.parse(localStorage.getItem(INT_LOGS_KEY) || '[]');
    const newLog = {
      id: uuidv4(),
      type,
      status, // success, error, info
      message,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();
    localStorage.setItem(INT_LOGS_KEY, JSON.stringify(logs));
  },

  getLogs: (limit = 10) => {
    const logs = JSON.parse(localStorage.getItem(INT_LOGS_KEY) || '[]');
    return logs.slice(0, limit);
  }
};
