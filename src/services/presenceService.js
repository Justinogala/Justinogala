
import { realtimeService } from './realtimeService';

// Track active users and their cursors
class PresenceService {
  constructor() {
    this.activeUsers = new Map(); // Map<clientId, UserData>
    this.heartbeatInterval = null;
    this.currentUser = null;
    this.transcriptId = null;
  }

  join(transcriptId, user) {
    this.transcriptId = transcriptId;
    this.currentUser = user;
    this.activeUsers.clear(); // Reset on join

    // Broadcast presence immediately
    this.broadcastPresence();

    // Setup heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.broadcastPresence();
    }, 5000); // Every 5s

    // Listen for others
    return realtimeService.subscribe(`transcript:${transcriptId}:presence`, (payload) => {
      this.handlePresenceUpdate(payload);
    });
  }

  leave() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.transcriptId && this.currentUser) {
      realtimeService.broadcast(`transcript:${this.transcriptId}:presence`, {
        type: 'LEAVE',
        userId: this.currentUser.id
      });
    }
    
    this.activeUsers.clear();
    this.transcriptId = null;
  }

  updateCursor(position) { // position: { index, length, x, y }
    if (!this.transcriptId || !this.currentUser) return;

    realtimeService.broadcast(`transcript:${this.transcriptId}:presence`, {
      type: 'CURSOR_MOVE',
      userId: this.currentUser.id,
      user: this.currentUser,
      position: position,
      timestamp: Date.now()
    });
  }

  broadcastPresence() {
    if (!this.transcriptId || !this.currentUser) return;
    
    realtimeService.broadcast(`transcript:${this.transcriptId}:presence`, {
      type: 'HEARTBEAT',
      userId: this.currentUser.id,
      user: this.currentUser,
      timestamp: Date.now()
    });
  }

  handlePresenceUpdate(payload) {
    const { type, userId, user, timestamp } = payload;
    
    if (type === 'LEAVE') {
      this.activeUsers.delete(userId);
    } else {
      // Heartbeat or Cursor Move
      this.activeUsers.set(userId, {
        ...user,
        lastActive: timestamp,
        cursor: payload.position || this.activeUsers.get(userId)?.cursor
      });
    }

    // Prune stale users (inactive > 15s)
    const now = Date.now();
    for (const [id, data] of this.activeUsers.entries()) {
      if (now - data.lastActive > 15000) {
        this.activeUsers.delete(id);
      }
    }

    // Notify UI (Custom Event)
    window.dispatchEvent(new CustomEvent(`presence-update-${this.transcriptId}`, {
      detail: Array.from(this.activeUsers.values())
    }));
  }

  getActiveUsers() {
    return Array.from(this.activeUsers.values());
  }
}

export const presenceService = new PresenceService();
