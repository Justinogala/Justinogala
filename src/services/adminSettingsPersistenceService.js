
import { persistentSettingsService } from './persistentSettingsService';

const SECTIONS = ['general', 'security', 'email', 'notifications', 'system'];
const CATEGORY = 'global';

const DEFAULTS = {
  general: {
    appName: 'Munal',
    supportEmail: 'support@munal.ai',
    supportPhone: '+1 (555) 123-4567'
  },
  security: {
    sessionTimeout: 60,
    minPasswordLength: 8,
    enforce2FA: true
  },
  email: {
    smtpHost: '',
    smtpPort: '',
    username: '',
    password: ''
  },
  notifications: {
    newSignup: true,
    systemError: true,
    weeklyDigest: false
  },
  system: {
    maxUploadSize: 500,
    apiRateLimit: 1000,
    maintenanceMode: false
  }
};

/**
 * Service to manage global admin settings persistence.
 * Acts as a specific wrapper around the generic persistentSettingsService.
 */
export const adminSettingsPersistenceService = {
  /**
   * Load all settings sections, merging saved data with defaults
   */
  getAllSettings: () => {
    const settings = {};
    SECTIONS.forEach(section => {
      const saved = persistentSettingsService.loadSettings(CATEGORY, section);
      settings[section] = { ...DEFAULTS[section], ...saved };
    });
    return settings;
  },

  /**
   * Save a specific section of settings
   */
  saveSection: (section, data) => {
    if (!SECTIONS.includes(section)) {
      throw new Error(`Invalid settings section: ${section}`);
    }
    return persistentSettingsService.saveSettings(CATEGORY, section, data);
  },

  /**
   * Save all settings sections at once
   */
  saveAllSettings: (settings) => {
    const results = {};
    Object.keys(settings).forEach(section => {
      if (SECTIONS.includes(section)) {
        results[section] = persistentSettingsService.saveSettings(CATEGORY, section, settings[section]);
      }
    });
    return results;
  },

  /**
   * Reset all settings to defaults
   */
  resetSettings: () => {
    SECTIONS.forEach(section => {
      persistentSettingsService.deleteSettings(CATEGORY, section);
    });
    return JSON.parse(JSON.stringify(DEFAULTS));
  },

  /**
   * Get the timestamp of the most recently saved setting
   */
  getLastSaved: () => {
    let lastTs = null;
    SECTIONS.forEach(section => {
      const status = persistentSettingsService.getSettingsStatus(CATEGORY, section);
      if (status.timestamp) {
        const ts = new Date(status.timestamp);
        if (!lastTs || ts > lastTs) {
          lastTs = ts;
        }
      }
    });
    return lastTs;
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
  }
};
