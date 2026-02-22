import { getWorkspaceById } from './workspaceService';

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // Workspace Level
  MANAGE_WORKSPACE: 'manage_workspace',
  INVITE_MEMBERS: 'invite_members',
  MANAGE_BILLING: 'manage_billing',
  
  // Meeting Level
  CREATE_MEETING: 'create_meeting',
  EDIT_MEETING: 'edit_meeting',
  DELETE_MEETING: 'delete_meeting',
  VIEW_MEETING: 'view_meeting',
  SHARE_MEETING: 'share_meeting'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EDITOR]: [
    PERMISSIONS.CREATE_MEETING,
    PERMISSIONS.EDIT_MEETING,
    PERMISSIONS.VIEW_MEETING,
    PERMISSIONS.SHARE_MEETING
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_MEETING
  ]
};

export const checkPermission = async (userId, workspaceId, action) => {
  try {
    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) return false;

    // In a real app, userId would be compared against the logged-in user's ID securely
    // For this mock, we assume the user is valid if they exist in the members list
    
    // Check if user is owner (implicit admin)
    if (workspace.owner_id === userId) return true;

    const member = workspace.members.find(m => m.user_id === userId);
    if (!member) return false;

    const userRole = member.role || ROLES.VIEWER;
    const allowedPermissions = ROLE_PERMISSIONS[userRole] || [];

    return allowedPermissions.includes(action);
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};