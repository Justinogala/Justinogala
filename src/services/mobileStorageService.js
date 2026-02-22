
const STORAGE_PREFIX = 'munal_mobile_';
const QUOTA_LIMIT = 5 * 1024 * 1024; // 5MB

export const mobileStorageService = {
  setItem: (key, value, expiresInSeconds = null) => {
    try {
      // Check quota
      const currentSize = new Blob([JSON.stringify(localStorage)]).size;
      const newItemSize = new Blob([JSON.stringify(value)]).size;
      
      if (currentSize + newItemSize > QUOTA_LIMIT) {
        throw new Error('StorageQuotaExceeded');
      }

      const item = {
        value,
        timestamp: Date.now(),
        expiresAt: expiresInSeconds ? Date.now() + (expiresInSeconds * 1000) : null
      };
      
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(item));
      return true;
    } catch (e) {
      if (e.message === 'StorageQuotaExceeded') {
        console.error('Mobile Storage Quota Exceeded (5MB Limit)');
        // Optional: Implement LRU eviction strategy here
        return false;
      }
      console.error('Storage Error:', e);
      return false;
    }
  },

  getItem: (key) => {
    try {
      const itemStr = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        return null;
      }

      return item.value;
    } catch (e) {
      console.error('Error retrieving item:', e);
      return null;
    }
  },

  removeItem: (key) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },

  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },

  getStorageUsage: () => {
    let total = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x) && x.startsWith(STORAGE_PREFIX)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    return {
      usedBytes: total,
      totalBytes: QUOTA_LIMIT,
      percentage: (total / QUOTA_LIMIT) * 100
    };
  }
};
