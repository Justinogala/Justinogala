
/**
 * Service for handling persistent admin settings using localStorage
 * Provides structured access with metadata (timestamps, status)
 */

const getStorageKey = (category, key) => `admin_settings_${category}_${key}`;
const getMetadataKey = (category, key) => `admin_settings_${category}_${key}_metadata`;

export const persistentSettingsService = {
  /**
   * Save a setting value with automatic metadata
   */
  saveSettings: (category, key, value) => {
    try {
      const storageKey = getStorageKey(category, key);
      const metadataKey = getMetadataKey(category, key);
      
      localStorage.setItem(storageKey, JSON.stringify(value));
      
      const metadata = {
        timestamp: new Date().toISOString(),
        isActive: true,
        saved: true
      };
      localStorage.setItem(metadataKey, JSON.stringify(metadata));
      
      return { success: true, timestamp: metadata.timestamp };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Load a setting value
   */
  loadSettings: (category, key) => {
    try {
      const storageKey = getStorageKey(category, key);
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  },

  /**
   * Get all settings for a specific category
   * e.g. 'api', 'integration'
   */
  getAllSettings: (category) => {
    const settings = {};
    const keys = Object.keys(localStorage);
    const prefix = `admin_settings_${category}_`;
    
    keys.forEach(k => {
      if (k.startsWith(prefix) && !k.endsWith('_metadata')) {
        const keyName = k.replace(prefix, '');
        settings[keyName] = persistentSettingsService.loadSettings(category, keyName);
      }
    });
    
    return settings;
  },

  /**
   * Delete a specific setting
   */
  deleteSettings: (category, key) => {
    const storageKey = getStorageKey(category, key);
    const metadataKey = getMetadataKey(category, key);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(metadataKey);
  },

  /**
   * Clear all settings in a category
   */
  clearCategory: (category) => {
    const keys = Object.keys(localStorage);
    const prefix = `admin_settings_${category}_`;
    keys.forEach(k => {
      if (k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    });
  },

  /**
   * Get status metadata for a setting
   */
  getSettingsStatus: (category, key) => {
    try {
      const metadataKey = getMetadataKey(category, key);
      const metadata = localStorage.getItem(metadataKey);
      if (metadata) {
        return JSON.parse(metadata);
      }
      // If value exists but no metadata, consider it active but legacy
      const val = persistentSettingsService.loadSettings(category, key);
      if (val) {
        return { saved: true, isActive: true, timestamp: null };
      }
      return { saved: false, isActive: false, timestamp: null };
    } catch (error) {
      return { saved: false, isActive: false, timestamp: null };
    }
  },

  /**
   * Validate storage integrity
   */
  validateSettingsIntegrity: () => {
    try {
      const testKey = '__integrity_test__';
      localStorage.setItem(testKey, 'ok');
      const val = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return val === 'ok';
    } catch (e) {
      return false;
    }
  }
};
