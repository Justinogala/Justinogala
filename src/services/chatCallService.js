
import { v4 as uuidv4 } from 'uuid';

// Mock service for handling calls
export const chatCallService = {
  activeCall: null,
  callListeners: [],

  initiateCall: async (conversationId, caller, type = 'voice') => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const callId = uuidv4();
    const callSession = {
      id: callId,
      conversationId,
      caller,
      type, // 'voice' or 'video'
      status: 'ringing', // ringing, connected, ended
      startTime: null,
      duration: 0
    };
    
    chatCallService.activeCall = callSession;
    chatCallService.notifyListeners(callSession);
    
    // Auto-connect after 3 seconds for demo purposes
    setTimeout(() => {
      if (chatCallService.activeCall && chatCallService.activeCall.id === callId) {
        chatCallService.activeCall.status = 'connected';
        chatCallService.activeCall.startTime = Date.now();
        chatCallService.notifyListeners(chatCallService.activeCall);
      }
    }, 3000);

    return callSession;
  },

  acceptCall: async (callId) => {
    if (chatCallService.activeCall && chatCallService.activeCall.id === callId) {
      chatCallService.activeCall.status = 'connected';
      chatCallService.activeCall.startTime = Date.now();
      chatCallService.notifyListeners(chatCallService.activeCall);
      return chatCallService.activeCall;
    }
    throw new Error("Call not found");
  },

  endCall: async (callId) => {
    if (chatCallService.activeCall) {
      const endedCall = { ...chatCallService.activeCall, status: 'ended', endTime: Date.now() };
      chatCallService.activeCall = null;
      chatCallService.notifyListeners(endedCall);
      return endedCall;
    }
  },

  getCallStatus: () => {
    return chatCallService.activeCall;
  },

  subscribeToCalls: (callback) => {
    chatCallService.callListeners.push(callback);
    return () => {
      chatCallService.callListeners = chatCallService.callListeners.filter(cb => cb !== callback);
    };
  },

  notifyListeners: (data) => {
    chatCallService.callListeners.forEach(cb => cb(data));
  }
};
