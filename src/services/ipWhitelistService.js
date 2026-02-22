
import { v4 as uuidv4 } from 'uuid';

const IP_WHITELIST_KEY = 'munal_ip_whitelist';
const ACCESS_LOG_KEY = 'munal_ip_access_logs';

const getWhitelistData = () => {
  try {
    return JSON.parse(localStorage.getItem(IP_WHITELIST_KEY) || '{}');
  } catch {
    return {};
  }
};

export const ipWhitelistService = {
  addIP: (userId, ipAddress, description) => {
    const data = getWhitelistData();
    if (!data[userId]) data[userId] = [];
    
    const newEntry = {
      id: uuidv4(),
      ipAddress,
      description,
      createdAt: new Date().toISOString()
    };
    
    data[userId].push(newEntry);
    localStorage.setItem(IP_WHITELIST_KEY, JSON.stringify(data));
    return newEntry;
  },

  removeIP: (userId, entryId) => {
    const data = getWhitelistData();
    if (!data[userId]) return false;
    
    data[userId] = data[userId].filter(entry => entry.id !== entryId);
    localStorage.setItem(IP_WHITELIST_KEY, JSON.stringify(data));
    return true;
  },

  getWhitelist: (userId) => {
    const data = getWhitelistData();
    return data[userId] || [];
  },

  validateIP: (userId, ipAddress) => {
    const list = ipWhitelistService.getWhitelist(userId);
    if (list.length === 0) return true; // If no whitelist, allow all (default behavior)
    
    return list.some(entry => entry.ipAddress === ipAddress);
  },

  trackAccess: (userId, ipAddress, allowed) => {
    const logs = JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) || '[]');
    logs.push({
      userId,
      ipAddress,
      allowed,
      timestamp: new Date().toISOString()
    });
    // Keep logs manageable
    if (logs.length > 500) logs.shift();
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(logs));
  }
};
