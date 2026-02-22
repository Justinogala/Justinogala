
import { v4 as uuidv4 } from 'uuid';

const CALL_HISTORY_KEY = 'munal_call_history';

export const callHistoryService = {
  saveCallLog: (callData) => {
    try {
      const history = callHistoryService.getCallHistory();
      const newLog = {
        id: callData.id || uuidv4(),
        participants: callData.participants || [],
        callerId: callData.callerId,
        recipientId: callData.recipientId,
        type: callData.type || 'audio', // 'audio' or 'video'
        status: callData.status || 'completed', // 'missed', 'completed', 'rejected'
        duration: callData.duration || 0, // in seconds
        timestamp: new Date().toISOString()
      };
      
      const updatedHistory = [newLog, ...history];
      localStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(updatedHistory));
      return newLog;
    } catch (error) {
      console.error('Failed to save call log:', error);
      return null;
    }
  },

  getCallHistory: () => {
    try {
      const stored = localStorage.getItem(CALL_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve call history:', error);
      return [];
    }
  },

  deleteCallLog: (logId) => {
    try {
      const history = callHistoryService.getCallHistory();
      const updated = history.filter(log => log.id !== logId);
      localStorage.setItem(CALL_HISTORY_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to delete call log:', error);
      return false;
    }
  },

  getCallStats: () => {
    const history = callHistoryService.getCallHistory();
    return {
      totalCalls: history.length,
      audioCalls: history.filter(c => c.type === 'audio').length,
      videoCalls: history.filter(c => c.type === 'video').length,
      missedCalls: history.filter(c => c.status === 'missed').length,
      totalDuration: history.reduce((acc, curr) => acc + (curr.duration || 0), 0)
    };
  },

  formatDuration: (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    
    if (hours > 0) {
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};
