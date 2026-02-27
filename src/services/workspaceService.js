import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

// --- Workspace CRUD ---

export const createWorkspace = async (userId, name, description = '', plan = 'Free') => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        plan,
        owner_id: userId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create workspace');
    }
    
    const data = await response.json();
    return data.workspace;
  } catch (error) {
    console.error('Error creating workspace:', error);
    throw error;
  }
};

export const getWorkspaces = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    const data = await response.json();
    return data.workspaces || [];
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return [];
  }
};

export const getWorkspaceById = async (workspaceId) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return null;
  }
};

export const updateWorkspace = async (workspaceId, updates) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) throw new Error('Failed to update workspace');
    const data = await response.json();
    return data.workspace;
  } catch (error) {
    console.error('Error updating workspace:', error);
    throw error;
  }
};

export const deleteWorkspace = async (workspaceId) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete workspace');
    return true;
  } catch (error) {
    console.error('Error deleting workspace:', error);
    throw error;
  }
};

// --- Member Management ---

export const getMembers = async (workspaceId) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`);
    if (!response.ok) throw new Error('Failed to fetch members');
    const data = await response.json();
    return data.members || [];
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
};

export const addMember = async (workspaceId, email, role = 'member', addedBy = null) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        email,
        role,
        added_by: addedBy
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to add member');
    }
    return data.member;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
};

export const updateMemberRole = async (workspaceId, userId, role) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    
    if (!response.ok) throw new Error('Failed to update role');
    return true;
  } catch (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
};

export const removeMember = async (workspaceId, userId) => {
  try {
    const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to remove member');
    return true;
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

// --- Invitations (Legacy - now direct add) ---
export const sendInvitation = async (workspaceId, email, role = 'member', invitedBy = null) => {
  // Now just adds member directly
  return addMember(workspaceId, email, role, invitedBy);
};

export const getInvitations = async (workspaceId) => {
  // No pending invitations anymore - all members are active
  return [];
};

export const acceptInvitation = async (invitationId) => {
  // Not needed anymore
  return true;
};

export const declineInvitation = async (invitationId) => {
  // Not needed anymore
  return true;
};

export const cancelInvitation = async (invitationId) => {
  // Not needed anymore
  return true;
};

// --- Workspace Stats (computed from members) ---
export const getWorkspaceStats = async (workspaceId) => {
  try {
    const members = await getMembers(workspaceId);
    return {
      total_members: members.length,
      active_members: members.filter(m => m.status === 'active').length,
      pending_invites: 0, // No pending anymore
      activity_count: 24
    };
  } catch (error) {
    return {
      total_members: 0,
      active_members: 0,
      pending_invites: 0,
      activity_count: 0
    };
  }
};
