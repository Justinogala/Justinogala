
import { memberService } from './memberService';
import { roleService } from './roleService';

export const permissionService = {
  checkPermission: (teamId, userId, permission) => {
    const roleName = memberService.getMemberRole(teamId, userId);
    if (!roleName) return false;
    
    const permissions = roleService.getRolePermissions(roleName);
    return permissions.includes(permission);
  },

  // Convenience methods
  canEditTeam: (teamId, userId) => permissionService.checkPermission(teamId, userId, 'edit_team'),
  canDeleteTeam: (teamId, userId) => permissionService.checkPermission(teamId, userId, 'delete_team'),
  canAddMember: (teamId, userId) => permissionService.checkPermission(teamId, userId, 'add_member'),
  canRemoveMember: (teamId, userId) => permissionService.checkPermission(teamId, userId, 'remove_member'),
  canChangeRole: (teamId, userId) => permissionService.checkPermission(teamId, userId, 'change_role'),
  canViewLogs: (teamId, userId) => permissionService.checkPermission(teamId, userId, 'view_logs'),
  canEditContent: (teamId, userId) => permissionService.checkPermission(teamId, userId, 'edit_content'),
};
