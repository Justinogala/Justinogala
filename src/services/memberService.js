
import { activityLogService } from './activityLogService';

const MEMBERS_KEY = 'munal_team_members';

const getAllMemberships = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveMemberships = (memberships) => {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(memberships));
};

export const memberService = {
  addMember: (teamId, userId, role = 'Viewer', addedByUserId = null) => {
    const memberships = getAllMemberships();
    
    // Check if already exists
    if (memberships.some(m => m.team_id === teamId && m.user_id === userId)) {
      return; 
    }
    
    const newMember = {
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString()
    };
    
    memberships.push(newMember);
    saveMemberships(memberships);
    
    if (addedByUserId) {
      activityLogService.logActivity(teamId, addedByUserId, 'member_added', `User ${userId} added as ${role}`);
    }
    
    return newMember;
  },

  removeMember: (teamId, userId, removedByUserId) => {
    const memberships = getAllMemberships();
    const filtered = memberships.filter(m => !(m.team_id === teamId && m.user_id === userId));
    saveMemberships(filtered);
    
    activityLogService.logActivity(teamId, removedByUserId, 'member_removed', `User ${userId} removed from team`);
  },

  getTeamMembers: (teamId) => {
    const memberships = getAllMemberships();
    return memberships.filter(m => m.team_id === teamId);
  },
  
  getUserMemberships: (userId) => {
    const memberships = getAllMemberships();
    return memberships.filter(m => m.user_id === userId);
  },

  getMemberRole: (teamId, userId) => {
    const memberships = getAllMemberships();
    const member = memberships.find(m => m.team_id === teamId && m.user_id === userId);
    return member ? member.role : null;
  },

  updateMemberRole: (teamId, userId, newRole, updatedByUserId) => {
    const memberships = getAllMemberships();
    const index = memberships.findIndex(m => m.team_id === teamId && m.user_id === userId);
    
    if (index !== -1) {
      memberships[index].role = newRole;
      saveMemberships(memberships);
      
      activityLogService.logActivity(teamId, updatedByUserId, 'role_changed', `User ${userId} role changed to ${newRole}`);
      return memberships[index];
    }
    return null;
  }
};
