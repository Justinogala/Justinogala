
import { offlineSyncService } from './offlineSyncService';

export const offlineService = {
  init: () => {
    window.addEventListener('online', offlineService.handleOnline);
    window.addEventListener('offline', offlineService.handleOffline);
    
    // Check initial status
    if (navigator.onLine) {
      offlineSyncService.sync();
    }
  },

  cleanup: () => {
    window.removeEventListener('online', offlineService.handleOnline);
    window.removeEventListener('offline', offlineService.handleOffline);
  },

  handleOnline: () => {
    console.log('[Network] Connection restored');
    window.dispatchEvent(new Event('network-online'));
    
    // Trigger Sync
    offlineSyncService.sync();
  },

  handleOffline: () => {
    console.log('[Network] Connection lost');
    window.dispatchEvent(new Event('network-offline'));
  },

  isOnline: () => navigator.onLine,

  // Wrapper for actions that should be offline-capable
  performAction: async (actionType, payload, apiFunction) => {
    if (navigator.onLine) {
      try {
        return await apiFunction(payload);
      } catch (error) {
        // If it's a network error, fallback to queue
        if (!navigator.onLine) {
           console.log('[Offline] Network failed mid-request, queueing action.');
           offlineSyncService.queueAction(actionType, payload);
           return { offline: true, message: 'Action queued for sync' };
        }
        throw error;
      }
    } else {
      console.log('[Offline] Queueing action:', actionType);
      offlineSyncService.queueAction(actionType, payload);
      return { offline: true, message: 'You are offline. Action saved.' };
    }
  }
};
