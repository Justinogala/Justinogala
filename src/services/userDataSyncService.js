
/**
 * Service to handle synchronization between admin panel and user accounts.
 * This ensures that when an admin updates a user, the changes are reflected
 * immediately in local storage and any listening contexts.
 */

const USERS_KEY = 'munal_users';
const SYNC_EVENT = 'munal_user_sync';

export const userDataSyncService = {
  // Notify listeners that user data has changed
  notifyChange: (action, userId, data) => {
    const event = new CustomEvent(SYNC_EVENT, {
      detail: { action, userId, data, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
    
    // Log sync operation
    console.log(`[SyncService] ${action} on user ${userId}`, data);
  },

  // Subscribe to changes
  subscribe: (callback) => {
    window.addEventListener(SYNC_EVENT, callback);
    return () => window.removeEventListener(SYNC_EVENT, callback);
  },

  // Force sync from local storage (reload)
  syncFromStorage: () => {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      return users;
    } catch (error) {
      console.error('Failed to sync from storage', error);
      return [];
    }
  }
};
