
import { v4 as uuidv4 } from 'uuid';

const SESSIONS_KEY = 'munal_active_sessions';

const getSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveSessions = (sessions) => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const sessionSecurityService = {
  createSession: (userId, metadata = {}) => {
    const sessions = getSessions();
    const newSession = {
      id: uuidv4(),
      userId,
      ipAddress: '127.0.0.1', // Mock
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      revoked: false,
      ...metadata
    };
    
    sessions.push(newSession);
    saveSessions(sessions);
    return newSession;
  },

  validateSession: (sessionId) => {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return { valid: false, reason: 'not_found' };
    if (session.revoked) return { valid: false, reason: 'revoked' };
    if (new Date(session.expiresAt) < new Date()) return { valid: false, reason: 'expired' };

    // Update activity
    session.lastActive = new Date().toISOString();
    saveSessions(sessions);

    return { valid: true, session };
  },

  revokeSession: (sessionId) => {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index].revoked = true;
      saveSessions(sessions);
      return true;
    }
    return false;
  },

  getActiveSessions: (userId) => {
    const sessions = getSessions();
    return sessions.filter(s => s.userId === userId && !s.revoked && new Date(s.expiresAt) > new Date());
  },

  detectSuspiciousActivity: (userId) => {
    const sessions = getSessions();
    const userSessions = sessions.filter(s => s.userId === userId);
    
    // Simple check: multiple active sessions from different IPs (mock logic as IP is static here)
    // In real scenario, compare IPs and Locations
    const activeCount = userSessions.filter(s => !s.revoked && new Date(s.expiresAt) > new Date()).length;
    
    return {
      isSuspicious: activeCount > 3,
      details: activeCount > 3 ? 'Unusual number of active sessions' : 'Normal activity'
    };
  }
};
