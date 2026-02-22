
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  METRICS: 'echoNote_health_metrics',
  ALERTS: 'echoNote_health_alerts',
  LOGS: 'echoNote_health_logs',
  SERVICES: 'echoNote_health_services',
  TRENDS: 'echoNote_health_trends'
};

// --- Initial Data Generation ---

const generateTrendData = (days, baseValue, variance) => {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.max(0, baseValue + (Math.random() * variance * 2 - variance))
  }));
};

const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
    const alerts = [
      { id: uuidv4(), timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: 'warning', message: 'High memory usage detected on worker-02', status: 'unresolved' },
      { id: uuidv4(), timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'error', message: 'Database connection timeout', status: 'resolved' },
      { id: uuidv4(), timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), type: 'info', message: 'Scheduled backup completed successfully', status: 'resolved' },
      { id: uuidv4(), timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), type: 'warning', message: 'API rate limit approaching for user group B', status: 'unresolved' },
      { id: uuidv4(), timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'error', message: 'Payment gateway webhook failed', status: 'resolved' },
    ];
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    const logs = Array.from({ length: 15 }, (_, i) => ({
      id: uuidv4(),
      timestamp: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(),
      type: ['Database', 'API', 'Auth', 'System'][Math.floor(Math.random() * 4)],
      message: `Error processing request: ${['Timeout', 'Invalid Argument', 'Connection Refused', 'Null Pointer'][Math.floor(Math.random() * 4)]}`,
      stackTrace: 'at /app/src/services/db.js:45:12\nat processTicksAndRejections (internal/process/task_queues.js:95:5)',
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
    }));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }
};

// Initialize on load
initializeData();

// --- API Implementation ---

export const getSystemHealth = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    status: 'healthy', // healthy, warning, critical
    uptime: 99.98,
    lastCheck: new Date().toISOString(),
    description: 'All systems operational'
  };
};

export const getPerformanceMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    apiResponseTime: { value: 145, unit: 'ms', trend: -12, status: 'good' },
    errorRate: { value: 0.05, unit: '%', trend: -2, status: 'good' },
    failedJobs: { value: 2, unit: 'count', trend: 0, status: 'good' },
    dbQueryTime: { value: 24, unit: 'ms', trend: +5, status: 'warning' }
  };
};

export const getResourceUsage = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    storage: { used: 450, total: 1000, unit: 'GB', percentage: 45 },
    database: { used: 12.5, total: 50, unit: 'GB', percentage: 25 },
    memory: { used: 6.2, total: 16, unit: 'GB', percentage: 38.75 },
    cpu: { used: 24, total: 100, unit: '%', percentage: 24 }
  };
};

export const getServiceStatus = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const now = new Date().toISOString();
  return [
    { name: 'OpenAI API', status: 'connected', latency: '240ms', lastCheck: now },
    { name: 'Zoom Integration', status: 'connected', latency: '120ms', lastCheck: now },
    { name: 'Teams Integration', status: 'connected', latency: '185ms', lastCheck: now },
    { name: 'Email Service', status: 'connected', latency: '85ms', lastCheck: now },
  ];
};

export const getRecentAlerts = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const alerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
};

export const getErrorLogs = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
};

export const getHealthTrend = async (days = 30) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    uptime: generateTrendData(days, 99.9, 0.05),
    errorRate: generateTrendData(days, 0.1, 0.05),
    responseTime: generateTrendData(days, 150, 40)
  };
};

export const runHealthCheck = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Randomly generate a new alert sometimes
  if (Math.random() > 0.7) {
    addAlert('info', 'Routine health check completed. Minor latency detected in region us-east-1.');
  }

  return {
    status: 'healthy',
    timestamp: new Date().toISOString()
  };
};

export const testServiceConnection = async (serviceName) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const success = Math.random() > 0.1;
  return {
    status: success ? 'connected' : 'disconnected',
    latency: success ? Math.floor(Math.random() * 200 + 50) + 'ms' : 'N/A',
    message: success ? 'Connection successful' : 'Connection timeout'
  };
};

export const clearErrorLogs = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  localStorage.setItem(STORAGE_KEYS.LOGS, '[]');
  return true;
};

export const clearAlerts = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  localStorage.setItem(STORAGE_KEYS.ALERTS, '[]');
  return true;
};

export const addAlert = (type, message) => {
  const alerts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
  const newAlert = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    message,
    status: 'unresolved'
  };
  alerts.unshift(newAlert);
  if (alerts.length > 50) alerts.pop();
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  return newAlert;
};

export const addErrorLog = (type, message, stackTrace, severity) => {
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
  const newLog = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    message,
    stackTrace,
    severity
  };
  logs.unshift(newLog);
  if (logs.length > 100) logs.pop();
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  return newLog;
};

export const generateHealthReport = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    generatedAt: new Date().toISOString(),
    url: '#', // Mock URL
    filename: `health_report_${new Date().getTime()}.pdf`
  };
};
