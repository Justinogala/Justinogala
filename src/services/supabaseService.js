import { v4 as uuidv4 } from 'uuid';

/**
 * MOCK SUPABASE SERVICE using LocalStorage
 * This replaces the previous Supabase client logic for a fully local development experience.
 */

const MEETINGS_KEY = 'echoNote_meetings';
const CHAT_KEY = 'echoNote_chatHistory';
const SHARE_KEY = 'echoNote_shareLinks';
const BILLING_KEY = 'echoNote_billing';
const WORKSPACES_KEY = 'echoNote_workspaces';
const INVOICES_KEY = 'echoNote_invoices';
const PAYMENT_METHODS_KEY = 'echoNote_paymentMethods';
const WORKSPACE_MEMBERS_KEY = 'echoNote_workspaceMembers';
const ACTIVITY_LOGS_KEY = 'echoNote_activityLogs';

const getLocalData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded!', e);
    }
  }
};

// --- Existing Functions (Preserved) ---
export const saveMeeting = async (userId, meetingData) => {
  if (!userId) throw new Error('User ID is required');
  await new Promise(resolve => setTimeout(resolve, 500));
  const meetings = getLocalData(MEETINGS_KEY);
  const newMeeting = {
    id: uuidv4(),
    user_id: userId,
    title: meetingData.title,
    file_path: meetingData.filePath || '',
    duration: meetingData.duration || 0,
    status: meetingData.status || 'processing',
    transcript: meetingData.transcript || {},
    summary: meetingData.summary || {},
    action_items: meetingData.actionItems || [],
    insights: meetingData.insights || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  meetings.push(newMeeting);
  setLocalData(MEETINGS_KEY, meetings);
  return newMeeting;
};

export const getMeetings = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const meetings = getLocalData(MEETINGS_KEY);
  return meetings.filter(m => m.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getMeetingById = async (meetingId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const meetings = getLocalData(MEETINGS_KEY);
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) throw new Error('Meeting not found');
  return meeting;
};

export const updateMeeting = async (meetingId, updates) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const meetings = getLocalData(MEETINGS_KEY);
  const index = meetings.findIndex(m => m.id === meetingId);
  if (index === -1) throw new Error('Meeting not found');
  const updatedMeeting = { ...meetings[index], ...updates, updated_at: new Date().toISOString() };
  meetings[index] = updatedMeeting;
  setLocalData(MEETINGS_KEY, meetings);
  return updatedMeeting;
};

export const deleteMeeting = async (meetingId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const meetings = getLocalData(MEETINGS_KEY);
  const filtered = meetings.filter(m => m.id !== meetingId);
  setLocalData(MEETINGS_KEY, filtered);
  return true;
};

export const saveChatMessage = async (meetingId, userId, role, content) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const chatHistory = getLocalData(CHAT_KEY);
  const newMessage = { id: uuidv4(), meeting_id: meetingId, user_id: userId, role, content, created_at: new Date().toISOString() };
  chatHistory.push(newMessage);
  setLocalData(CHAT_KEY, chatHistory);
  return newMessage;
};

export const getChatHistory = async (meetingId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const chatHistory = getLocalData(CHAT_KEY);
  return chatHistory.filter(c => c.meeting_id === meetingId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

export const saveShareLink = async (meetingId, createdBy, token, expiresAt) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const shareLinks = getLocalData(SHARE_KEY);
  const newLink = { id: uuidv4(), meeting_id: meetingId, created_by: createdBy, token, expires_at: expiresAt, is_active: true, created_at: new Date().toISOString() };
  shareLinks.push(newLink);
  setLocalData(SHARE_KEY, shareLinks);
  return newLink;
};

export const getShareLinkByToken = async (token) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const shareLinks = getLocalData(SHARE_KEY);
  const link = shareLinks.find(l => l.token === token && l.is_active && new Date(l.expires_at) > new Date());
  if (!link) return null;
  const meetings = getLocalData(MEETINGS_KEY);
  const meeting = meetings.find(m => m.id === link.meeting_id);
  return { ...link, meetings: meeting };
};

export const getShareLinkByMeetingId = async (meetingId) => {
  const shareLinks = getLocalData(SHARE_KEY);
  return shareLinks.find(l => l.meeting_id === meetingId && l.is_active && new Date(l.expires_at) > new Date());
};

export const revokeShareLink = async (linkId) => {
  const shareLinks = getLocalData(SHARE_KEY);
  const index = shareLinks.findIndex(l => l.id === linkId);
  if (index !== -1) {
    shareLinks[index].is_active = false;
    setLocalData(SHARE_KEY, shareLinks);
  }
  return true;
};

// --- NEW Billing Functions ---
export const getBillingRecords = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return getLocalData(BILLING_KEY);
};

export const createBillingRecord = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const records = getLocalData(BILLING_KEY);
  const newRecord = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
  records.push(newRecord);
  setLocalData(BILLING_KEY, records);
  return newRecord;
};

export const updateBillingRecord = async (id, updates) => {
  const records = getLocalData(BILLING_KEY);
  const index = records.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Record not found');
  records[index] = { ...records[index], ...updates };
  setLocalData(BILLING_KEY, records);
  return records[index];
};

export const deleteBillingRecord = async (id) => {
  const records = getLocalData(BILLING_KEY);
  setLocalData(BILLING_KEY, records.filter(r => r.id !== id));
};

export const getInvoices = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const invoices = getLocalData(INVOICES_KEY);
  return userId ? invoices.filter(i => i.user_id === userId) : invoices;
};

export const getPaymentMethods = async (userId) => {
  const methods = getLocalData(PAYMENT_METHODS_KEY);
  return userId ? methods.filter(m => m.user_id === userId) : methods;
};

export const getSubscriptions = async () => {
  // Mock subscriptions derived from billing records or separate key
  const records = getLocalData(BILLING_KEY);
  return records.filter(r => r.type === 'subscription');
};

// --- NEW Workspace Functions ---
export const getWorkspaces = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return getLocalData(WORKSPACES_KEY);
};

export const getWorkspaceById = async (id) => {
  const workspaces = getLocalData(WORKSPACES_KEY);
  return workspaces.find(w => w.id === id);
};

export const createWorkspace = async (data) => {
  const workspaces = getLocalData(WORKSPACES_KEY);
  const newWorkspace = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
  workspaces.push(newWorkspace);
  setLocalData(WORKSPACES_KEY, workspaces);
  return newWorkspace;
};

export const updateWorkspace = async (id, updates) => {
  const workspaces = getLocalData(WORKSPACES_KEY);
  const index = workspaces.findIndex(w => w.id === id);
  if (index === -1) throw new Error('Workspace not found');
  workspaces[index] = { ...workspaces[index], ...updates };
  setLocalData(WORKSPACES_KEY, workspaces);
  return workspaces[index];
};

export const deleteWorkspace = async (id) => {
  const workspaces = getLocalData(WORKSPACES_KEY);
  setLocalData(WORKSPACES_KEY, workspaces.filter(w => w.id !== id));
};

export const getWorkspaceMembers = async (workspaceId) => {
  const members = getLocalData(WORKSPACE_MEMBERS_KEY);
  return members.filter(m => m.workspace_id === workspaceId);
};

export const addWorkspaceMember = async (data) => {
  const members = getLocalData(WORKSPACE_MEMBERS_KEY);
  const newMember = { id: uuidv4(), ...data, joined_at: new Date().toISOString() };
  members.push(newMember);
  setLocalData(WORKSPACE_MEMBERS_KEY, members);
  return newMember;
};

export const removeWorkspaceMember = async (workspaceId, userId) => {
  const members = getLocalData(WORKSPACE_MEMBERS_KEY);
  setLocalData(WORKSPACE_MEMBERS_KEY, members.filter(m => !(m.workspace_id === workspaceId && m.user_id === userId)));
};

export const getWorkspaceActivity = async (workspaceId) => {
  const logs = getLocalData(ACTIVITY_LOGS_KEY);
  return logs.filter(l => l.workspace_id === workspaceId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};