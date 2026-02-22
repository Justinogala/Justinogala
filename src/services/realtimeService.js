
import { v4 as uuidv4 } from 'uuid';

// Simulating Supabase Realtime using BroadcastChannel for local development
// This allows multiple tabs to communicate and simulate "multi-user" collaboration
const BROADCAST_CHANNEL_NAME = 'munal-realtime-simulation';

class MockRealtimeService {
  constructor() {
    this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    this.subscribers = new Map();
    this.isConnected = false;
    this.clientId = uuidv4();
    
    // Listen for messages from other tabs
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  connect() {
    this.isConnected = true;
    console.log(`[Realtime] Connected as ${this.clientId}`);
    this.broadcast('system', { type: 'USER_JOINED', clientId: this.clientId });
  }

  disconnect() {
    this.broadcast('system', { type: 'USER_LEFT', clientId: this.clientId });
    this.isConnected = false;
    console.log(`[Realtime] Disconnected`);
  }

  /**
   * Subscribe to a specific channel/topic
   * @param {string} topic - e.g., 'transcript:123'
   * @param {function} callback - Function to handle incoming events
   */
  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);
    return () => this.unsubscribe(topic, callback);
  }

  unsubscribe(topic, callback) {
    if (this.subscribers.has(topic)) {
      this.subscribers.get(topic).delete(callback);
    }
  }

  /**
   * Broadcast an event to other clients
   * @param {string} topic 
   * @param {object} payload 
   */
  broadcast(topic, payload) {
    if (!this.isConnected) return;
    
    const message = {
      topic,
      payload,
      senderId: this.clientId,
      timestamp: new Date().toISOString()
    };
    
    // Send to other tabs
    this.channel.postMessage(message);
    
    // Trigger local subscribers (optional, depending on if we want optimistic updates handling elsewhere)
    // Generally for broadcast, we don't echo back to sender via the channel listener, 
    // but we might want to notify local listeners if the architecture expects it.
    // For this simulation, we'll let the sender handle their own optimistic UI.
  }

  handleMessage(message) {
    const { topic, payload, senderId } = message;
    
    // Ignore own messages if they loop back (BroadcastChannel usually doesn't, but good practice)
    if (senderId === this.clientId) return;

    if (this.subscribers.has(topic)) {
      this.subscribers.get(topic).forEach(callback => {
        try {
          callback(payload);
        } catch (e) {
          console.error('[Realtime] Error in subscriber:', e);
        }
      });
    }
  }

  getClientId() {
    return this.clientId;
  }
}

export const realtimeService = new MockRealtimeService();
