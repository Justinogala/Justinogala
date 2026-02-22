import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from './passwordGeneratorService';

const USERS_KEY = 'echoNote_users';
const AUDIT_LOGS_KEY = 'echoNote_audit_logs';
const WORKSPACES_KEY = 'echoNote_workspaces';
const NOTIFICATIONS_KEY = 'echoNote_admin_notifications';
const REPORTS_KEY = 'echoNote_admin_reports';

// --- Helpers ---
const getLocalData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Audit Logging ---
export const logAdminAction = (action, targetType, targetId, details, status = 'success') => {
  const logs = getLocalData(AUDIT_LOGS_KEY);
  
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').split('.')[0];

  const newLog = {
    id: uuidv4(),
    timestamp: timestamp,
    adminUser: 'admin@echonote.ai',
    actionType: action,
    action: action, // For compatibility
    targetType,
    targetId,
    details,
    status,
    ip: '192.168.1.1'
  };
  
  logs.unshift(newLog);
  if (logs.length > 500) logs.pop();
  setLocalData(AUDIT_LOGS_KEY, logs);
  
  return newLog;
};

export const getAuditLogs = async (filters = {}) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  let logs = getLocalData(AUDIT_LOGS_KEY);
  
  if (filters.action) {
    logs = logs.filter(l => l.action.toLowerCase().includes(filters.action.toLowerCase()));
  }
  
  return logs;
};

// --- Notifications ---
export const getAdminNotifications = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const notifications = getLocalData(NOTIFICATIONS_KEY);
  
  // Seed initial notifications if empty
  if (notifications.length === 0) {
    const seeds = [
      { id: 'n1', type: 'user', title: 'New User Registration', message: 'John Doe created an account', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), read: false },
      { id: 'n2', type: 'system', title: 'System Update', message: 'Maintenance scheduled for tonight', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: true },
      { id: 'n3', type: 'billing', title: 'Payment Received', message: '$49.00 payment from Workspace X', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), read: false }
    ];
    setLocalData(NOTIFICATIONS_KEY, seeds);
    return seeds;
  }
  return notifications;
};

export const markNotificationRead = async (id) => {
  const notifications = getLocalData(NOTIFICATIONS_KEY);
  const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  setLocalData(NOTIFICATIONS_KEY, updated);
  return updated;
};

export const markAllNotificationsRead = async () => {
  const notifications = getLocalData(NOTIFICATIONS_KEY);
  const updated = notifications.map(n => ({ ...n, read: true }));
  setLocalData(NOTIFICATIONS_KEY, updated);
  return updated;
};

export const clearAllNotifications = async () => {
  setLocalData(NOTIFICATIONS_KEY, []);
  return [];
};

export const createNotification = (type, title, message) => {
  const notifications = getLocalData(NOTIFICATIONS_KEY);
  const newNotification = {
    id: uuidv4(),
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false
  };
  notifications.unshift(newNotification);
  setLocalData(NOTIFICATIONS_KEY, notifications);
  return newNotification;
};

// --- User Management ---
export const getAllUsers = async (filters = {}, page = 1, limit = 10) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  let users = getLocalData(USERS_KEY);

  if (filters.search) {
    const s = filters.search.toLowerCase();
    users = users.filter(u => 
      u.email.toLowerCase().includes(s) || 
      (u.name && u.name.toLowerCase().includes(s))
    );
  }
  
  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    pro: users.filter(u => ['pro', 'business'].includes(u.plan)).length
  };
  
  if (limit === 0 || limit === 'all') {
    return { users, total: users.length, totalPages: 1, stats };
  }

  const total = users.length;
  const start = (page - 1) * limit;
  const paginatedUsers = users.slice(start, start + limit);

  return { 
    users: paginatedUsers, 
    total, 
    totalPages: Math.ceil(total / limit),
    stats
  };
};

export const createUser = async (userData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = getLocalData(USERS_KEY);

  if (users.some(u => u.email === userData.email)) {
    throw new Error("User with this email already exists");
  }

  const newUser = {
    id: uuidv4(),
    ...userData,
    passwordHash: userData.password ? hashPassword(userData.password) : null,
    status: 'active',
    transcriptionMinutes: 0,
    storageUsed: 0,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    plan: 'free'
  };
  
  delete newUser.password;
  users.push(newUser);
  setLocalData(USERS_KEY, users);
  
  logAdminAction('Create User', 'user', newUser.id, `Created user ${newUser.email}`);
  createNotification('user', 'User Created', `Admin created new user: ${newUser.email}`);
  
  return newUser;
};

export const deleteUser = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  let users = getLocalData(USERS_KEY);
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  
  users = users.filter(u => u.id !== userId);
  setLocalData(USERS_KEY, users);
  
  logAdminAction('Delete User', 'user', userId, `Deleted user ${user.email}`);
  return true;
};

export const suspendUser = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const users = getLocalData(USERS_KEY);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error("User not found");
  
  users[userIndex].status = 'suspended';
  setLocalData(USERS_KEY, users);
  
  logAdminAction('Suspend User', 'user', userId, `Suspended user ${users[userIndex].email}`);
  return users[userIndex];
};

export const activateUser = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const users = getLocalData(USERS_KEY);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error("User not found");
  
  users[userIndex].status = 'active';
  setLocalData(USERS_KEY, users);
  
  logAdminAction('Activate User', 'user', userId, `Activated user ${users[userIndex].email}`);
  return users[userIndex];
};

export const updateUser = async (userId, updates) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const users = getLocalData(USERS_KEY);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) throw new Error("User not found");
  
  users[userIndex] = { ...users[userIndex], ...updates };
  setLocalData(USERS_KEY, users);
  
  logAdminAction('Update User', 'user', userId, `Updated user details for ${users[userIndex].email}`);
  return users[userIndex];
};

export const resetUserPassword = async (userId, newPassword = null) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = getLocalData(USERS_KEY);
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  
  const tempPassword = newPassword || Math.random().toString(36).slice(-8);
  // In a real app, we would hash this and save it.
  // For mock, we just log it.
  
  logAdminAction('Reset Password', 'user', userId, `Reset password for ${user.email}`);
  return tempPassword;
};

export const getUserActivity = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  // Mock activity logs
  return [
    { id: 1, timestamp: new Date().toISOString(), action: 'Login', details: 'Successful login from 192.168.1.1' },
    { id: 2, timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'Transcription', details: 'Processed meeting "Weekly Sync"' },
    { id: 3, timestamp: new Date(Date.now() - 172800000).toISOString(), action: 'Update Profile', details: 'Changed display name' }
  ];
};

// --- Workspace Management ---
export const createWorkspace = async (workspaceData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const workspaces = getLocalData(WORKSPACES_KEY);
  
  const newWorkspace = {
    id: uuidv4(),
    ...workspaceData,
    members: 1,
    meetings: 0,
    storage: 0,
    status: 'active',
    created: new Date().toISOString(),
    membersList: [{ email: workspaceData.ownerEmail, role: 'owner' }]
  };

  workspaces.push(newWorkspace);
  setLocalData(WORKSPACES_KEY, workspaces);

  logAdminAction('Workspace Created', 'workspace', newWorkspace.id, `Created workspace ${workspaceData.name}`);
  createNotification('workspace', 'Workspace Created', `New workspace created: ${workspaceData.name}`);

  return newWorkspace;
};

export const getWorkspaces = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return getLocalData(WORKSPACES_KEY);
};

export const deleteWorkspace = async (workspaceId) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  let workspaces = getLocalData(WORKSPACES_KEY);
  const ws = workspaces.find(w => w.id === workspaceId);
  if (!ws) throw new Error("Workspace not found");
  
  workspaces = workspaces.filter(w => w.id !== workspaceId);
  setLocalData(WORKSPACES_KEY, workspaces);
  
  logAdminAction('Delete Workspace', 'workspace', workspaceId, `Deleted workspace ${ws.name}`);
  return true;
};

export const updateWorkspace = async (workspaceId, updates) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const workspaces = getLocalData(WORKSPACES_KEY);
  const index = workspaces.findIndex(w => w.id === workspaceId);
  if (index === -1) throw new Error("Workspace not found");
  
  workspaces[index] = { ...workspaces[index], ...updates };
  setLocalData(WORKSPACES_KEY, workspaces);
  
  logAdminAction('Update Workspace', 'workspace', workspaceId, `Updated workspace ${workspaces[index].name}`);
  return workspaces[index];
};

export const getWorkspaceMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const workspaces = getLocalData(WORKSPACES_KEY);
  
  return {
    totalWorkspaces: workspaces.length,
    totalMembers: workspaces.reduce((acc, curr) => acc + (curr.members || 1), 0),
    storageUsed: '124 GB' // Mock
  };
};

// --- Reports ---
export const generateReport = async (reportData) => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
  const reports = getLocalData(REPORTS_KEY);
  
  const newReport = {
    id: uuidv4(),
    ...reportData,
    status: 'completed',
    generatedAt: new Date().toISOString(),
    size: '1.2 MB', // Mock size
    downloadUrl: '#' // Mock URL
  };
  
  reports.unshift(newReport);
  setLocalData(REPORTS_KEY, reports);
  
  logAdminAction('Generate Report', 'report', newReport.id, `Generated ${reportData.type} report`);
  createNotification('report', 'Report Ready', `Your ${reportData.type} report is ready for download.`);
  
  return newReport;
};

export const getReports = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return getLocalData(REPORTS_KEY);
};

// --- Exports ---
export const exportData = async (exportType, format) => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate large export
  // In a real app, this would return a Blob
  return {
    success: true,
    message: `${exportType} exported as ${format}`,
    size: '4.5 MB'
  };
};

// --- Dashboard Stats ---
export const getAdminStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = getLocalData(USERS_KEY);
  const workspaces = getLocalData(WORKSPACES_KEY);
  
  return {
    totalUsers: { value: users.length, trend: '+12%', trendUp: true },
    activeWorkspaces: { value: workspaces.length, trend: '+5%', trendUp: true },
    storageUsed: { value: '45%', trend: '+2%', trendUp: false },
    apiCosts: { value: '$1,240', trend: '+8%', trendUp: false }
  };
};