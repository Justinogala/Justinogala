
import { v4 as uuidv4 } from 'uuid';
import { activityLogService } from './activityLogService';
import { memberService } from './memberService';

const TEAMS_KEY = 'munal_teams';

const getTeams = () => {
  try {
    return JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveTeams = (teams) => {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
};

export const teamService = {
  createTeam: (name, description, ownerId) => {
    const teams = getTeams();
    const newTeam = {
      id: uuidv4(),
      name,
      description,
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    teams.push(newTeam);
    saveTeams(teams);
    
    // Automatically add owner as Admin member
    memberService.addMember(newTeam.id, ownerId, 'Admin');
    
    activityLogService.logActivity(newTeam.id, ownerId, 'team_created', `Team "${name}" created`);
    
    return newTeam;
  },

  getTeam: (teamId) => {
    const teams = getTeams();
    return teams.find(t => t.id === teamId);
  },

  updateTeam: (teamId, updates, userId) => {
    const teams = getTeams();
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error("Team not found");
    
    const updatedTeam = { 
      ...teams[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    
    teams[index] = updatedTeam;
    saveTeams(teams);
    
    activityLogService.logActivity(teamId, userId, 'team_updated', `Team details updated`);
    
    return updatedTeam;
  },

  deleteTeam: (teamId, userId) => {
    const teams = getTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (team) {
      const filteredTeams = teams.filter(t => t.id !== teamId);
      saveTeams(filteredTeams);
      
      // Usually we'd cleanup members, logs, etc here too, 
      // but strictly following scope we'll just log before "deletion" implies it's gone.
      // Since logs are separate, we might want to keep them or delete them. 
      // For now, let's leave logs as audit trail.
    }
  },
  
  // Get all teams a user belongs to
  getUserTeams: (userId) => {
    const memberships = memberService.getUserMemberships(userId);
    const teams = getTeams();
    return teams.filter(t => memberships.some(m => m.team_id === t.id));
  }
};
