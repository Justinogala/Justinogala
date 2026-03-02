
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiConfigService } from '@/services/apiConfigService';
import { integrationConfigService } from '@/services/integrationConfigService';
import { persistentSettingsService } from '@/services/persistentSettingsService';
import { useToast } from '@/components/ui/use-toast';

export const AdminSettingsContext = createContext(null);

export const AdminSettingsProvider = ({ children }) => {
  const [apiConfig, setApiConfig] = useState(null);
  const [integrationConfig, setIntegrationConfig] = useState(null);
  const [apiLogs, setApiLogs] = useState([]);
  const [integrationLogs, setIntegrationLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsStatus, setSettingsStatus] = useState({});
  
  // Hook is correctly placed at the top level of the provider component
  const { toast } = useToast();

  useEffect(() => {
    const loadData = () => {
      try {
        const apis = apiConfigService.getConfig();
        const ints = integrationConfigService.getConfig();
        
        // Ensure apis has required structure with full defaults
        const safeApis = {
          openai: { key: '', status: 'inactive', health: 'neutral', lastTested: null },
          googleCloud: { key: '', status: 'inactive', health: 'neutral', lastTested: null },
          defaults: { transcription: 'openai', summarization: 'openai' },
          usage: {
            openai: { calls: 0, quota: 1000, cost: 0 },
            googleCloud: { calls: 0, quota: 1000, cost: 0 }
          },
          ...apis,
          // Merge nested objects properly
          openai: { key: '', status: 'inactive', health: 'neutral', lastTested: null, ...apis?.openai },
          googleCloud: { key: '', status: 'inactive', health: 'neutral', lastTested: null, ...apis?.googleCloud },
          usage: {
            openai: { calls: 0, quota: 1000, cost: 0, ...apis?.usage?.openai },
            googleCloud: { calls: 0, quota: 1000, cost: 0, ...apis?.usage?.googleCloud }
          }
        };
        
        setApiConfig(safeApis);
        setIntegrationConfig(ints || {});
        setApiLogs(apiConfigService.getLogs() || []);
        setIntegrationLogs(integrationConfigService.getLogs() || []);
        
        const apiStatus = persistentSettingsService.getSettingsStatus('api', 'config');
        const intStatus = persistentSettingsService.getSettingsStatus('integration', 'config');
        
        setSettingsStatus({
          api: apiStatus || { saved: false, isActive: false },
          integration: intStatus || { saved: false, isActive: false }
        });
      } catch (e) {
        console.error("Error loading admin settings:", e);
        // Set safe defaults on error
        setApiConfig({
          openai: { key: '', status: 'inactive', health: 'neutral', lastTested: null },
          googleCloud: { key: '', status: 'inactive', health: 'neutral', lastTested: null },
          defaults: { transcription: 'openai', summarization: 'openai' },
          usage: {
            openai: { calls: 0, quota: 1000, cost: 0 },
            googleCloud: { calls: 0, quota: 1000, cost: 0 }
          }
        });
        setIntegrationConfig({});
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveSettings = useCallback((category, key, value) => {
    const result = persistentSettingsService.saveSettings(category, key, value);
    if (result.success) {
      setSettingsStatus(prev => ({
        ...prev,
        [category]: persistentSettingsService.getSettingsStatus(category, key)
      }));
    }
    return result;
  }, []);

  const loadSettings = useCallback((category) => {
    return persistentSettingsService.getAllSettings(category);
  }, []);

  const updateApiConfig = useCallback(async (newConfig) => {
    const saved = apiConfigService.saveConfig(newConfig);
    setApiConfig(saved);
    saveSettings('api', 'config', saved);
    toast({ title: "API Settings Saved", description: "Your API configurations have been updated and are active." });
  }, [saveSettings, toast]);

  const testApiConnection = useCallback(async (provider, key) => {
    try {
      const result = await apiConfigService.testConnection(provider, key);
      setApiConfig(prevConfig => {
        const newConfig = { ...prevConfig };
        if (newConfig[provider]) {
          newConfig[provider].status = result.status;
          newConfig[provider].health = result.health;
          newConfig[provider].lastTested = new Date().toISOString();
          
          if (result.success && result.usage) {
            newConfig.usage = newConfig.usage || {};
            newConfig.usage[provider] = {
              ...newConfig.usage[provider],
              ...result.usage
            };
          }
        }
        return newConfig;
      });
      
      if (!result.success) {
        apiConfigService.logError(provider, result.error);
        refreshLogs();
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateIntegrationConfig = useCallback((newConfig) => {
    const saved = integrationConfigService.saveConfig(newConfig);
    setIntegrationConfig(saved);
    saveSettings('integration', 'config', saved);
    toast({ title: "Integration Settings Saved", description: "Integration preferences updated." });
  }, [saveSettings, toast]);

  const testIntegration = useCallback(async (type) => {
    const result = await integrationConfigService.testConnection(type);
    
    integrationConfigService.logEvent(
      type, 
      result.success ? 'success' : 'error',
      result.message
    );
    refreshLogs();

    setIntegrationConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      if (newConfig[type]) {
        newConfig[type].status = result.status;
        newConfig[type].lastUsed = new Date().toISOString(); 
      }
      return newConfig;
    });

    return result;
  }, []);

  const refreshLogs = useCallback(() => {
    setApiLogs(apiConfigService.getLogs());
    setIntegrationLogs(integrationConfigService.getLogs());
  }, []);

  const value = {
    loading,
    apiConfig,
    integrationConfig,
    apiLogs,
    integrationLogs,
    settingsStatus,
    saveSettings,
    loadSettings,
    updateApiConfig,
    testApiConnection,
    updateIntegrationConfig,
    testIntegration,
    refreshLogs,
    integrationStats: integrationConfigService.getStats()
  };

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  );
};

export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }

  const getSettingsStatus = (category, key) => {
    return persistentSettingsService.getSettingsStatus(category, key);
  };

  const isSettingActive = (category, key) => {
    const status = getSettingsStatus(category, key);
    return status.isActive && status.saved;
  };

  return {
    ...context,
    getSettingsStatus,
    isSettingActive
  };
};
