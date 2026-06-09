/**
 * IndexedDB-based offline storage for Munal AI
 * Caches documents, presentations, sheets, calendar events locally
 * for offline access and syncs when back online.
 */

const DB_NAME = 'munal_offline_db';
const DB_VERSION = 1;
const STORES = ['documents', 'presentations', 'sheets', 'calendar_events', 'sync_queue'];

let db = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      STORES.forEach(store => {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
  });
};

const getStore = async (storeName, mode = 'readonly') => {
  const database = await openDB();
  const tx = database.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

export const offlineDB = {
  // Save a single item
  put: async (storeName, item) => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // Save multiple items (replace all for a given store)
  putAll: async (storeName, items) => {
    const database = await openDB();
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Get a single item by ID
  get: async (storeName, id) => {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  // Get all items in a store
  getAll: async (storeName) => {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // Delete a single item
  delete: async (storeName, id) => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // Clear a store
  clear: async (storeName) => {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // ============== Sync Queue ==============

  // Add to sync queue
  queueAction: async (action) => {
    const item = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...action,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    };
    await offlineDB.put('sync_queue', item);
    return item;
  },

  // Get pending sync actions
  getPendingActions: async () => {
    const all = await offlineDB.getAll('sync_queue');
    return all.filter(a => a.status === 'pending' || (a.status === 'failed' && a.retries < 3));
  },

  // Process sync queue when back online
  processQueue: async (apiBaseUrl, token) => {
    if (!navigator.onLine) return { processed: 0, failed: 0 };

    const pending = await offlineDB.getPendingActions();
    if (pending.length === 0) return { processed: 0, failed: 0 };

    let processed = 0;
    let failed = 0;

    for (const action of pending) {
      try {
        action.status = 'syncing';
        await offlineDB.put('sync_queue', action);

        const url = `${apiBaseUrl}${action.endpoint}`;
        const opts = {
          method: action.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };
        if (action.body) opts.body = JSON.stringify(action.body);

        const res = await fetch(url, opts);
        if (res.ok) {
          await offlineDB.delete('sync_queue', action.id);
          processed++;
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (e) {
        action.status = 'failed';
        action.retries = (action.retries || 0) + 1;
        action.lastError = e.message;
        await offlineDB.put('sync_queue', action);
        failed++;
      }
    }

    return { processed, failed };
  },
};

export default offlineDB;
