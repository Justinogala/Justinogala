
/**
 * Service for Admin System Health Monitoring
 * Uses localStorage for mock data persistence
 */

const HEALTH_KEY = 'echoNote_admin_health_data';

export const getSystemHealth = async () => {
  await new Promise(resolve => setTimeout(resolve, 600)); // Simulate latency
  
  // Randomize slightly for "live" feel
  const uptime = (99.90 + Math.random() * 0.09).toFixed(3);
  
  return {
    status: 'Operational',
    uptime: `${uptime}%`,
    lastCheck: new Date().toISOString(),
    version: '1.2.4',
    environment: 'Production'
  };
};

export const getPerformanceMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [
    { name: 'API Response Time', value: Math.floor(120 + Math.random() * 50) + 'ms', status: 'optimal' },
    { name: 'DB Query Time', value: Math.floor(20 + Math.random() * 30) + 'ms', status: 'optimal' },
    { name: 'Error Rate', value: (Math.random() * 0.5).toFixed(2) + '%', status: 'optimal' },
    { name: 'Failed Jobs (24h)', value: Math.floor(Math.random() * 5), status: 'attention' }
  ];
};

export const getResourceUsage = async () => {
  return [
    { name: 'Storage', used: 450, total: 1000, unit: 'GB', percentage: 45 },
    { name: 'Database Size', used: 2.4, total: 10, unit: 'GB', percentage: 24 },
    { name: 'Memory (RAM)', used: 6.2, total: 16, unit: 'GB', percentage: 38 },
    { name: 'CPU Load', used: 12, total: 100, unit: '%', percentage: 12 }
  ];
};

export const getServiceStatus = async () => {
  return [
    { name: 'OpenAI API', status: 'operational', latency: '240ms' },
    { name: 'Zoom Integration', status: 'operational', latency: '120ms' },
    { name: 'MS Teams Integration', status: 'degraded', latency: '850ms', message: 'High latency detected' },
    { name: 'Email Service (SMTP)', status: 'operational', latency: '45ms' },
    { name: 'Database Cluster', status: 'operational', latency: '12ms' },
    { name: 'Storage Bucket', status: 'operational', latency: '80ms' }
  ];
};

export const getRecentAlerts = async () => {
  return [
    { id: 1, type: 'warning', message: 'High memory usage detected on worker-02', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 2, type: 'error', message: 'Failed to sync with MS Teams for user u-1234', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: 3, type: 'info', message: 'Daily backup completed successfully', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() }
  ];
};

export const runHealthCheck = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { success: true, message: "Health check passed. All systems nominal." };
};

export const getHealthTrend = async () => {
  // Mock trend data for charts
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return {
    uptime: hours.map(() => 99.9 + Math.random() * 0.1),
    errorRate: hours.map(() => Math.random() * 0.5),
    responseTime: hours.map(() => 100 + Math.random() * 100)
  };
};
