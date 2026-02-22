
import { v4 as uuidv4 } from 'uuid';

const WORKSPACES_KEY = 'munal_workspaces';
const MEMBERS_KEY = 'munal_workspace_members';
const INVITATIONS_KEY = 'munal_workspace_invitations';

// Helper to delay (simulate network)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Workspace CRUD ---

export const createWorkspace = async (userId, name, description = '', plan = 'Free') => {
  await delay(500);
  const workspaces = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || '[]');
  
  const newWorkspace = {
    id: uuidv4(),
    name,
    description,
    plan,
    owner_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    icon_url: null, // Could be an initial or generated image
    settings: {
      allow_member_invites: true,
      public: false
    }
  };

  workspaces.push(newWorkspace);
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));

  // Add owner as a member automatically
  await addMember(newWorkspace.id, userId, 'owner', 'active');

  return newWorkspace;
};

export const getWorkspaces = async (userId) => {
  await delay(300);
  const workspaces = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || '[]');
  const members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');

  // Find workspaces where user is owner OR a member
  const userWorkspaceIds = members
    .filter(m => m.user_id === userId)
    .map(m => m.workspace_id);

  return workspaces.filter(w => w.owner_id === userId || userWorkspaceIds.includes(w.id));
};

export const getWorkspaceById = async (workspaceId) => {
  await delay(200);
  const workspaces = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || '[]');
  return workspaces.find(w => w.id === workspaceId) || null;
};

export const updateWorkspace = async (workspaceId, updates) => {
  await delay(300);
  const workspaces = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || '[]');
  const index = workspaces.findIndex(w => w.id === workspaceId);
  
  if (index === -1) throw new Error('Workspace not found');
  
  workspaces[index] = { ...workspaces[index], ...updates, updated_at: new Date().toISOString() };
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
  
  return workspaces[index];
};

export const deleteWorkspace = async (workspaceId) => {
  await delay(500);
  let workspaces = JSON.parse(localStorage.getItem(WORKSPACES_KEY) || '[]');
  workspaces = workspaces.filter(w => w.id !== workspaceId);
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));

  // Cleanup members and invitations
  let members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  members = members.filter(m => m.workspace_id !== workspaceId);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));

  let invitations = JSON.parse(localStorage.getItem(INVITATIONS_KEY) || '[]');
  invitations = invitations.filter(i => i.workspace_id !== workspaceId);
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
  
  return true;
};

export const archiveWorkspace = async (workspaceId) => {
  return updateWorkspace(workspaceId, { status: 'archived' });
};

// --- Member Management ---

export const getWorkspaceMembers = async (workspaceId) => {
  await delay(300);
  const members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  const workspaceMembers = members.filter(m => m.workspace_id === workspaceId);
  
  // In a real app, we'd join with the users table to get names/avatars.
  // Here we'll simulate it by returning the stored email if available, or mocking data
  // For the current user, we might need to fetch user details separately or store them in member record
  return workspaceMembers;
};

export const addMember = async (workspaceId, userId, role = 'member', status = 'active', email = '') => {
  // await delay(200); // Internal call, maybe skip delay
  const members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  
  if (members.some(m => m.workspace_id === workspaceId && m.user_id === userId)) {
    return null; // Already a member
  }

  const newMember = {
    id: uuidv4(),
    workspace_id: workspaceId,
    user_id: userId,
    email: email, // Useful for display if user object isn't fully available
    role,
    status,
    joined_at: new Date().toISOString()
  };

  members.push(newMember);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  return newMember;
};

export const removeMember = async (workspaceId, userId) => {
  await delay(300);
  let members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  members = members.filter(m => !(m.workspace_id === workspaceId && m.user_id === userId));
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  return true;
};

export const updateMemberRole = async (workspaceId, userId, newRole) => {
  await delay(300);
  const members = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  const index = members.findIndex(m => m.workspace_id === workspaceId && m.user_id === userId);
  
  if (index === -1) throw new Error('Member not found');
  
  members[index].role = newRole;
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
  return members[index];
};

// --- Invitations ---

export const inviteMember = async (workspaceId, email, role = 'member', invitedByUserId) => {
  await delay(500);
  const invitations = JSON.parse(localStorage.getItem(INVITATIONS_KEY) || '[]');
  
  // Check if already invited
  if (invitations.some(i => i.workspace_id === workspaceId && i.email === email && i.status === 'pending')) {
    throw new Error('User already invited');
  }

  const newInvitation = {
    id: uuidv4(),
    workspace_id: workspaceId,
    email,
    role,
    token: uuidv4(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    status: 'pending',
    invited_by: invitedByUserId,
    created_at: new Date().toISOString()
  };

  invitations.push(newInvitation);
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
  
  return newInvitation;
};

export const getInvitations = async (workspaceId) => {
  await delay(300);
  const invitations = JSON.parse(localStorage.getItem(INVITATIONS_KEY) || '[]');
  return invitations.filter(i => i.workspace_id === workspaceId);
};

export const cancelInvitation = async (invitationId) => {
  await delay(300);
  let invitations = JSON.parse(localStorage.getItem(INVITATIONS_KEY) || '[]');
  invitations = invitations.filter(i => i.id !== invitationId);
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invitations));
  return true;
};

// --- Helper for Stats ---

export const getWorkspaceStats = async (workspaceId) => {
  // Mock stats
  return {
    storage_used: Math.floor(Math.random() * 50) + ' GB',
    storage_limit: '100 GB',
    member_count: (await getWorkspaceMembers(workspaceId)).length,
    activity_count: 24
  };
};
