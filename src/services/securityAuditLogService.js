
import { v4 as uuidv4 } from 'uuid';

const AUDIT_LOGS_KEY = 'munal_security_audit_logs';

const getStoredLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const securityAuditLogService = {
  logEvent: (userId, eventType, details = {}) => {
    const logs = getStoredLogs();
    const newLog = {
      id: uuidv4(),
      userId,
      eventType, // e.g., 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE'
      details,
      ipAddress: '127.0.0.1', // Mock IP in browser
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Keep only last 1000 logs for localStorage efficiency
    if (logs.length >= 1000) logs.shift();
    
    logs.push(newLog);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    return newLog;
  },

  getAuditLogs: (page = 1, limit = 20) => {
    const logs = getStoredLogs().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: logs.slice(start, end),
      total: logs.length,
      page,
      totalPages: Math.ceil(logs.length / limit)
    };
  },

  filterLogs: (filters = {}) => {
    // filters: { eventType, userId, dateFrom, dateTo }
    let logs = getStoredLogs();
    
    if (filters.eventType) {
      logs = logs.filter(l => l.eventType === filters.eventType);
    }
    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters.dateFrom) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.dateTo));
    }
    
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  searchLogs: (keyword) => {
    const logs = getStoredLogs();
    const lowerKeyword = keyword.toLowerCase();
    
    return logs.filter(log => 
      log.eventType.toLowerCase().includes(lowerKeyword) ||
      JSON.stringify(log.details).toLowerCase().includes(lowerKeyword) ||
      log.userId?.toLowerCase().includes(lowerKeyword)
    );
  },

  exportLogs: () => {
    const logs = getStoredLogs();
    const header = ['ID', 'User ID', 'Event Type', 'Details', 'Timestamp'];
    const csvContent = [
      header.join(','),
      ...logs.map(row => [
        row.id,
        row.userId,
        row.eventType,
        JSON.stringify(row.details).replace(/,/g, ';'), // Escape commas
        row.timestamp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "security_audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
