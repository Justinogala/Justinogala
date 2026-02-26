/**
 * Service to manage global admin settings persistence.
 * Uses MongoDB via Backend API for permanent data storage.
 */

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const SECTIONS = ['general', 'security', 'email', 'notifications', 'system'];

const DEFAULTS = {
  general: {
    appName: 'Munal',
    supportEmail: 'support@munal.ai',
    supportPhone: '+1 (555) 123-4567',
    websiteUrl: 'https://munal.ai',
    timezone: 'UTC'
  },
  security: {
    sessionTimeout: 60,
    minPasswordLength: 8,
    enforce2FA: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15
  },
  email: {
    smtpHost: '',
    smtpPort: 587,
    username: '',
    password: '',
    senderName: 'Munal System',
    senderEmail: '',
    useTLS: true
  },
  notifications: {
    newSignup: true,
    systemError: true,
    weeklyDigest: false,
    emailNotifications: true,
    pushNotifications: false
  },
  system: {
    maxUploadSize: 500,
    apiRateLimit: 1000,
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info'
  }
};

// Cache for settings
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000; // 30 second cache

export const adminSettingsPersistenceService = {
  /**
   * Load all settings sections from MongoDB, merging saved data with defaults
   */
  getAllSettings: async () => {
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
      const settings = {};
      
      // Merge saved settings with defaults for each section
      SECTIONS.forEach(section => {
        const saved = data.settings?.[section] || {};
        // Remove metadata before merging
        const cleanSaved = { ...saved };
        delete cleanSaved._metadata;
        
        settings[section] = { ...DEFAULTS[section], ...cleanSaved };
      });
      
      // Update cache
      settingsCache = settings;
      cacheTimestamp = Date.now();
      
      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      // Return defaults on error
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  },

  /**
   * Synchronous version that returns cached data or defaults (for initial render)
   */
  getAllSettingsSync: () => {
    if (settingsCache) {
      return settingsCache;
    }
    return JSON.parse(JSON.stringify(DEFAULTS));
  },

  /**
   * Save a specific section of settings to MongoDB
   */
  saveSection: async (section, data) => {
    if (!SECTIONS.includes(section)) {
      throw new Error(`Invalid settings section: ${section}`);
    }
    
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: section,
          settings: data
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      const result = await response.json();
      
      // Invalidate cache on successful save
      settingsCache = null;
      cacheTimestamp = null;
      
      return {
        success: true,
        timestamp: result.updated_at
      };
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Save all settings sections at once to MongoDB
   */
  saveAllSettings: async (settings) => {
    const results = {};
    
    for (const section of SECTIONS) {
      if (settings[section]) {
        results[section] = await adminSettingsPersistenceService.saveSection(section, settings[section]);
      }
    }
    
    return results;
  },

  /**
   * Reset all settings to defaults (clears MongoDB data)
   */
  resetSettings: async () => {
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
      
      return JSON.parse(JSON.stringify(DEFAULTS));
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  },

  /**
   * Get the timestamp of the most recently saved setting
   */
  getLastSaved: async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/settings`);
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      let lastTs = null;
      
      // Find most recent timestamp from all sections
      if (data.settings) {
        Object.values(data.settings).forEach(section => {
          if (section._metadata?.updated_at) {
            const ts = new Date(section._metadata.updated_at);
            if (!lastTs || ts > lastTs) {
              lastTs = ts;
            }
          }
        });
      }
      
      return lastTs;
    } catch (error) {
      return null;
    }
  },

  /**
   * Get status for a specific section
   */
  getSettingsStatus: async (section) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/${section}`);
      if (!response.ok) {
        return { saved: false, isActive: false, timestamp: null };
      }
      
      const data = await response.json();
      
      return {
        saved: data.exists,
        isActive: data.exists,
        timestamp: data.updated_at || null
      };
    } catch (error) {
      return { saved: false, isActive: false, timestamp: null };
    }
  },

  /**
   * Apply settings immediately to the application
   * (e.g. updating document title, logging config changes)
   */
  applySettings: (settings) => {
    // Apply General Settings
    if (settings.general?.appName) {
      document.title = `${settings.general.appName} - Admin Dashboard`;
    }

    // Log applications (simulating real-time updates)
    console.groupCollapsed('Applying Admin Settings');
    console.log('App Name Updated:', settings.general?.appName);
    console.log('Security Policy:', settings.security);
    console.log('Notification Rules:', settings.notifications);
    console.log('System Limits:', settings.system);
    console.groupEnd();

    return true;
  },

  /**
   * Get default values
   */
  getDefaults: () => {
    return JSON.parse(JSON.stringify(DEFAULTS));
  },

  /**
   * Invalidate cache (useful after external changes)
   */
  invalidateCache: () => {
    settingsCache = null;
    cacheTimestamp = null;
  }
};
