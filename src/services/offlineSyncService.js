
import { v4 as uuidv4 } from 'uuid';
import { mobileStorageService } from './mobileStorageService';

const SYNC_QUEUE_KEY = 'sync_queue';
const MAX_RETRIES = 3;

export const offlineSyncService = {
  // Add action to queue
  queueAction: (actionType, payload) => {
    const queue = mobileStorageService.getItem(SYNC_QUEUE_KEY) || [];
    const newAction = {
      id: uuidv4(),
      type: actionType,
      payload,
      timestamp: Date.now(),
      status: 'pending', // pending, syncing, failed, completed
      retries: 0
    };
    
    queue.push(newAction);
    mobileStorageService.setItem(SYNC_QUEUE_KEY, queue);
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('offline-action-queued', { detail: newAction }));
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      offlineSyncService.sync();
    }
  },

  // Process sync queue
  sync: async () => {
    if (!navigator.onLine) return;

    const queue = mobileStorageService.getItem(SYNC_QUEUE_KEY) || [];
    const pendingActions = queue.filter(a => a.status === 'pending' || (a.status === 'failed' && a.retries < MAX_RETRIES));

    if (pendingActions.length === 0) return;

    window.dispatchEvent(new Event('sync-started'));

    const updatedQueue = [...queue];

    for (const action of pendingActions) {
      try {
        // Find current index in case queue changed
        const index = updatedQueue.findIndex(a => a.id === action.id);
        if (index === -1) continue;

        updatedQueue[index].status = 'syncing';
        mobileStorageService.setItem(SYNC_QUEUE_KEY, updatedQueue);

        // Simulate API Call based on action type
        // In real app, import specific services here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock network
        console.log(`[Sync] Processed ${action.type}`, action.payload);

        // Success
        updatedQueue[index].status = 'completed';
        updatedQueue[index].syncedAt = Date.now();
        
      } catch (error) {
        console.error(`[Sync] Failed action ${action.id}`, error);
        const index = updatedQueue.findIndex(a => a.id === action.id);
        if (index !== -1) {
          updatedQueue[index].status = 'failed';
          updatedQueue[index].retries += 1;
          updatedQueue[index].lastError = error.message;
        }
      }
    }

    // Clean up completed actions
    const cleanedQueue = updatedQueue.filter(a => a.status !== 'completed');
    mobileStorageService.setItem(SYNC_QUEUE_KEY, cleanedQueue);

    window.dispatchEvent(new CustomEvent('sync-completed', { 
      detail: { 
        processed: pendingActions.length, 
        remaining: cleanedQueue.length 
      } 
    }));
  },

  getQueueStatus: () => {
    const queue = mobileStorageService.getItem(SYNC_QUEUE_KEY) || [];
    return {
      total: queue.length,
      pending: queue.filter(a => a.status === 'pending').length,
      failed: queue.filter(a => a.status === 'failed').length
    };
  }
};
