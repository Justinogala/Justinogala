
// Simple wrapper for LocalStorage/IndexedDB for offline data persistence
const STORAGE_PREFIX = 'munal_offline_';
const SYNC_QUEUE_KEY = `${STORAGE_PREFIX}sync_queue`;

export const offlineDataService = {
  // Save data locally
  save: (key, data) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving offline data', e);
      return false;
    }
  },

  // Get local data
  get: (key) => {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error retrieving offline data', e);
      return null;
    }
  },

  // Queue an action for when back online
  queueAction: (action) => {
    const queue = offlineDataService.getSyncQueue();
    queue.push({
      ...action,
      id: Date.now().toString(), // Simple ID
      timestamp: Date.now(),
      status: 'pending'
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    
    // Register background sync if available
    import('@/utils/serviceWorkerManager').then(module => {
      module.requestBackgroundSync('sync-offline-actions');
    });
  },

  getSyncQueue: () => {
    try {
      const queue = localStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      return [];
    }
  },

  clearSyncQueue: () => {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  },

  // Process queue (to be called when online)
  processQueue: async (apiHandler) => {
    if (!navigator.onLine) return;
    
    const queue = offlineDataService.getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline actions...`);
    
    // Process each item
    // Note: In a real app, you'd probably want more robust error handling/retries per item
    const failedItems = [];
    
    for (const item of queue) {
      try {
        await apiHandler(item);
      } catch (e) {
        console.error('Failed to process offline item', item, e);
        failedItems.push(item);
      }
    }

    // Update queue with only failed items
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedItems));
    
    return {
      processed: queue.length - failedItems.length,
      failed: failedItems.length
    };
  }
};
