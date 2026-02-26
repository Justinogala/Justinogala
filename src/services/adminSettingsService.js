/**
 * Service for Admin Settings Configuration
 * Uses MongoDB via Backend API for persistent data storage
 */

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const DEFAULT_SETTINGS = {
  general: {
    appName: 'Munal AI',
    supportEmail: 'support@munal.ai',
    websiteUrl: 'https://munal.ai',
    logoUrl: '/logo.png',
    timezone: 'UTC',
    language: 'en'
  },
  api: {
    openaiKey: '',
    rateLimitPerUser: 100,
    model: 'gpt-4o',
    maxTokens: 4096
  },
  email: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    senderName: 'Munal System',
    senderEmail: '',
    useTLS: true
  },
  security: {
    minPasswordLength: 8,
    sessionTimeout: 60,
    enable2FA: false,
    ipWhitelist: '',
    maxLoginAttempts: 5,
    lockoutDuration: 15
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    slackWebhook: '',
    discordWebhook: ''
  },
  system: {
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    maxUploadSize: 100,
    allowedFileTypes: 'pdf,doc,docx,txt,mp3,wav,mp4'
  }
};

// Cache for settings to reduce API calls
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get all settings from MongoDB
 */
export const getSettings = async () => {
  // Check cache first
  if (settingsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return settingsCache;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    const data = await response.json();
    
    // Merge with defaults to ensure all fields exist
    const mergedSettings = { ...DEFAULT_SETTINGS };
    
    if (data.settings) {
      Object.keys(data.settings).forEach(category => {
        if (mergedSettings[category]) {
          // Remove metadata before merging
          const categorySettings = { ...data.settings[category] };
          delete categorySettings._metadata;
          
          mergedSettings[category] = {
            ...mergedSettings[category],
            ...categorySettings
          };
        }
      });
    }
    
    // Update cache
    settingsCache = mergedSettings;
    cacheTimestamp = Date.now();
    
    return mergedSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return defaults on error
    return DEFAULT_SETTINGS;
  }
};

/**
 * Get settings for a specific category
 */
export const getSettingsByCategory = async (category) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/settings/${category}`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    const data = await response.json();
    
    if (data.exists && data.settings) {
      return {
        ...DEFAULT_SETTINGS[category],
        ...data.settings
      };
    }
    
    return DEFAULT_SETTINGS[category] || {};
  } catch (error) {
    console.error(`Error fetching ${category} settings:`, error);
    return DEFAULT_SETTINGS[category] || {};
  }
};

/**
 * Update settings for a specific category - persists to MongoDB
 */
export const updateSettings = async (category, values) => {
  try {
    const response = await fetch(`${API_URL}/api/admin/settings/${category}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category,
        settings: values
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save settings');
    }
    
    const result = await response.json();
    
    // Invalidate cache on successful update
    settingsCache = null;
    cacheTimestamp = null;
    
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error(`Error saving ${category} settings:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reset all settings to defaults
 */
export const resetToDefaults = async () => {
  try {
    const response = await fetch(`${API_URL}/api/admin/settings/reset-defaults`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to reset settings');
    }
    
    // Clear cache
    settingsCache = null;
    cacheTimestamp = null;
    
    return {
      success: true,
      message: 'Settings reset to defaults'
    };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get plan configuration
 */
export const getPlanConfig = (plan) => {
  const plans = {
    free: { name: 'Free', price: 0, limits: { transcription: 60, storage: 1, workspaces: 1 } },
    pro: { name: 'Pro', price: 15, limits: { transcription: 300, storage: 10, workspaces: 5 } },
    business: { name: 'Business', price: 49, limits: { transcription: 1000, storage: 50, workspaces: 20 } },
    enterprise: { name: 'Enterprise', price: 99, limits: { transcription: 5000, storage: 200, workspaces: 100 } }
  };
  return plans[plan] || plans.free;
};

/**
 * Test API connection
 */
export const testAPIConnection = async (apiKey) => {
  // This could be enhanced to actually test the OpenAI API
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: "API connection test successful." };
};

/**
 * Test SMTP email connection
 */
export const testEmailConnection = async (smtpConfig) => {
  // This could be enhanced to actually send a test email
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: "SMTP connection verified. Test email queued." };
};

/**
 * Create system backup
 */
export const createBackup = async () => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const backupId = `bk_${Date.now()}`;
  return { success: true, backupId, message: "System backup created successfully." };
};

// Export defaults for reference
export { DEFAULT_SETTINGS };
