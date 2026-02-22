import { useContext } from 'react';
import { AdminSettingsContext } from '@/context/AdminSettingsContext';
import { persistentSettingsService } from '@/services/persistentSettingsService';

export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }

  // Helper methods extending context
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