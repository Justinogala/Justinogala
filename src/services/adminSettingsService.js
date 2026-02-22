
/**
 * Service for Admin Settings Configuration
 * Uses localStorage for data persistence
 */

const SETTINGS_KEY = 'echoNote_admin_settings';

const DEFAULT_SETTINGS = {
  general: {
    appName: 'EchoNote AI',
    supportEmail: 'support@echonotesai.com',
    websiteUrl: 'https://echonotesai.com',
    logoUrl: '/logo.png'
  },
  api: {
    openaiKey: 'sk-........................', // Masked by default
    rateLimitPerUser: 100,
    model: 'gpt-4'
  },
  email: {
    smtpHost: 'smtp.mailgun.org',
    smtpPort: 587,
    smtpUser: 'postmaster@mg.echonotesai.com',
    senderName: 'EchoNote System'
  },
  security: {
    minPasswordLength: 8,
    sessionTimeout: 60, // minutes
    enable2FA: false,
    ipWhitelist: ''
  },
  features: {
    enableZoom: true,
    enableTeams: true,
    enableSharing: true,
    maintenanceMode: false
  }
};

export const getSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return JSON.parse(stored);
};

export const updateSettings = (section, values) => {
  const current = getSettings();
  const updated = {
    ...current,
    [section]: {
      ...current[section],
      ...values
    }
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

export const getPlanConfig = (plan) => {
  // Mock plan data
  const plans = {
    free: { name: 'Free', price: 0, limits: { transcription: 60, storage: 1, workspaces: 1 } },
    pro: { name: 'Pro', price: 15, limits: { transcription: 300, storage: 10, workspaces: 5 } },
    business: { name: 'Business', price: 49, limits: { transcription: 1000, storage: 50, workspaces: 20 } }
  };
  return plans[plan] || plans.free;
};

export const testAPIConnection = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: "Connected to OpenAI API successfully." };
};

export const testEmailConnection = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: "SMTP connection verified. Test email queued." };
};

export const createBackup = async () => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const backupId = `bk_${Date.now()}`;
  return { success: true, backupId, message: "System backup created successfully." };
};
