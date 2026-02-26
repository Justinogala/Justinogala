
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
  },

  /**
   * Get all registered users (team members) except the current user
   * Uses a cached version that's fetched from API
   * @param {string} currentUserId - The current user's ID to exclude
   * @returns {Array} List of users
   */
  getAllUsers: (currentUserId) => {
    // First try cached users (synchronous for immediate UI)
    try {
      const cachedUsers = localStorage.getItem('munal_cached_users');
      const users = cachedUsers ? JSON.parse(cachedUsers) : [];
      
      return users
        .filter(user => user.id !== currentUserId && user.status !== 'Suspended')
        .map(user => ({
          id: user.id,
          name: user.name || user.full_name || user.email?.split('@')[0] || 'Unknown',
          email: user.email,
          avatar: user.avatar
        }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  /**
   * Fetch all users from API and cache them
   * @param {string} currentUserId - The current user's ID to exclude
   * @returns {Promise<Array>} List of users
   */
  fetchAllUsers: async (currentUserId) => {
    try {
      const apiUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_API_URL || window.location.origin;
      const response = await fetch(`${apiUrl}/api/users`);
      
      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        // Cache users
        localStorage.setItem('munal_cached_users', JSON.stringify(users));
        
        return users
          .filter(user => user.id !== currentUserId && user.status !== 'Suspended')
          .map(user => ({
            id: user.id,
            name: user.name || user.full_name || user.email?.split('@')[0] || 'Unknown',
            email: user.email,
            avatar: user.avatar
          }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching users from API:', error);
      return teamService.getAllUsers(currentUserId);
    }
  },

  /**
   * Get user info by ID
   * @param {string} userId - The user ID to look up
   * @returns {Object|null} User info or null if not found
   */
  getUserById: (userId) => {
    try {
      const cachedUsers = localStorage.getItem('munal_cached_users');
      const users = cachedUsers ? JSON.parse(cachedUsers) : [];
      const user = users.find(u => u.id === userId);
      
      if (user) {
        return {
          id: user.id,
          name: user.name || user.full_name || user.email?.split('@')[0] || 'Unknown',
          email: user.email,
          avatar: user.avatar
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  /**
   * Get multiple users by their IDs
   * @param {Array} userIds - Array of user IDs
   * @returns {Array} Array of user info objects
   */
  getUsersByIds: (userIds) => {
    if (!userIds || !Array.isArray(userIds)) return [];
    
    try {
      const cachedUsers = localStorage.getItem('munal_cached_users');
      const users = cachedUsers ? JSON.parse(cachedUsers) : [];
      
      return userIds
        .map(id => {
          const user = users.find(u => u.id === id);
          if (user) {
            return {
              id: user.id,
              name: user.name || user.full_name || user.email?.split('@')[0] || 'Unknown',
              email: user.email,
              avatar: user.avatar
            };
          }
          return null;
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting users by IDs:', error);
      return [];
    }
  }
};
