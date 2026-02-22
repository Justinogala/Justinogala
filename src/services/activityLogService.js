
import { v4 as uuidv4 } from 'uuid';

const ACTIVITY_LOGS_KEY = 'munal_activity_logs';

const getLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_LOGS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveLogs = (logs) => {
  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(logs));
};

export const activityLogService = {
  logActivity: (teamId, userId, type, details) => {
    const logs = getLogs();
    const newLog = {
      id: uuidv4(),
      team_id: teamId,
      user_id: userId,
      activity_type: type,
      details,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog); // Add to beginning
    saveLogs(logs);
    return newLog;
  },

  getTeamLogs: (teamId, filters = {}) => {
    let logs = getLogs().filter(l => l.team_id === teamId);
    
    if (filters.userId) {
      logs = logs.filter(l => l.user_id === filters.userId);
    }
    if (filters.type) {
      logs = logs.filter(l => l.activity_type === filters.type);
    }
    
    return logs;
  }
};
