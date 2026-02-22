
import { v4 as uuidv4 } from 'uuid';

const ADMIN_INTEGRATION_CONFIG_KEY = 'munal_admin_integration_config';
const USER_INTEGRATION_DATA_KEY = 'munal_user_integrations';
const INTEGRATION_LOGS_KEY = 'munal_integration_logs';

const AVAILABLE_INTEGRATIONS = [
  { id: 'slack', name: 'Slack', icon: 'Slack', category: 'Communication' },
  { id: 'google_drive', name: 'Google Drive', icon: 'HardDrive', category: 'Storage' },
  { id: 'dropbox', name: 'Dropbox', icon: 'Box', category: 'Storage' },
  { id: 'msteams', name: 'Microsoft Teams', icon: 'Users', category: 'Conferencing' },
  { id: 'zapier', name: 'Zapier', icon: 'Zap', category: 'Automation' }
];

const getAdminConfig = () => {
  const stored = localStorage.getItem(ADMIN_INTEGRATION_CONFIG_KEY);
  return stored ? JSON.parse(stored) : { enabled: {}, stats: { totalConnected: 0, totalCalls: 0 } };
};

const saveAdminConfig = (config) => {
  localStorage.setItem(ADMIN_INTEGRATION_CONFIG_KEY, JSON.stringify(config));
};

const getUserData = () => {
  const stored = localStorage.getItem(USER_INTEGRATION_DATA_KEY);
  return stored ? JSON.parse(stored) : { connected: {} };
};

const saveUserData = (data) => {
  localStorage.setItem(USER_INTEGRATION_DATA_KEY, JSON.stringify(data));
};

const addLog = (log) => {
  const stored = localStorage.getItem(INTEGRATION_LOGS_KEY);
  const logs = stored ? JSON.parse(stored) : [];
  logs.unshift({
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...log
  });
  if (logs.length > 1000) logs.length = 1000;
  localStorage.setItem(INTEGRATION_LOGS_KEY, JSON.stringify(logs));
};

export const integrationService = {
  getAllIntegrations: () => {
    const config = getAdminConfig();
    return AVAILABLE_INTEGRATIONS.map(i => ({
      ...i,
      isEnabled: config.enabled[i.id] !== false // Default to true if not explicitly disabled
    }));
  },

  toggleIntegration: (id, enabled, adminUser) => {
    const config = getAdminConfig();
    config.enabled[id] = enabled;
    saveAdminConfig(config);
    addLog({
      action: enabled ? 'ENABLE_INTEGRATION' : 'DISABLE_INTEGRATION',
      integration: id,
      user: adminUser?.email || 'Admin',
      status: 'Success'
    });
  },

  getConnectedIntegrations: async () => {
    const userData = getUserData();
    const adminConfig = getAdminConfig();
    
    // Only return integrations that are both connected by user AND enabled by admin
    return Object.keys(userData.connected)
      .filter(id => adminConfig.enabled[id] !== false)
      .map(id => {
        const base = AVAILABLE_INTEGRATIONS.find(i => i.id === id);
        return {
          ...base,
          ...userData.connected[id]
        };
      });
  },

  connectIntegration: async (integrationId, credentials) => {
    const adminConfig = getAdminConfig();
    if (adminConfig.enabled[integrationId] === false) {
      throw new Error("This integration is disabled by the administrator.");
    }

    const userData = getUserData();
    userData.connected[integrationId] = {
      connectedAt: new Date().toISOString(),
      status: 'active',
      settings: { autoSync: true }
    };
    saveUserData(userData);

    // Update stats
    adminConfig.stats.totalConnected = (adminConfig.stats.totalConnected || 0) + 1;
    saveAdminConfig(adminConfig);

    addLog({
      action: 'CONNECT',
      integration: integrationId,
      user: 'User', // In real app would pass actual user
      status: 'Success'
    });
    return true;
  },

  disconnectIntegration: async (integrationId) => {
    const userData = getUserData();
    if (userData.connected[integrationId]) {
      delete userData.connected[integrationId];
      saveUserData(userData);
      addLog({
        action: 'DISCONNECT',
        integration: integrationId,
        user: 'User',
        status: 'Success'
      });
      return true;
    }
    return false;
  },

  getIntegrationStatus: async (integrationId) => {
    const userData = getUserData();
    return userData.connected[integrationId] ? 'connected' : 'disconnected';
  },

  getIntegrationLogs: async () => {
    const stored = localStorage.getItem(INTEGRATION_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getStats: () => {
    return getAdminConfig().stats;
  }
};
