import { callHistoryService } from './callHistoryService';
import { audioRingingService } from './audioRingingService';

// Mock WebRTC service for demo environment
// In a real app, this would handle RTCPeerConnection, ICE candidates, and Signaling
export const webrtcCallService = {
  localStream: null,
  remoteStream: null,
  currentCallId: null,

  // Initialize media devices
  async getLocalStream(type = 'video') {
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720 } : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  },

  initiateCall(caller, recipient, type) {
    // Start ringing sound
    audioRingingService.startOutgoingRing();
    
    return {
      id: `call_${Date.now()}`,
      caller,
      recipient,
      type,
      status: 'calling',
      startTime: null
    };
  },

  acceptCall(callId) {
    audioRingingService.stopRingingSound();
    return {
      id: callId,
      status: 'connected',
      startTime: Date.now()
    };
  },

  rejectCall(callId) {
    audioRingingService.stopRingingSound();
    return {
      id: callId,
      status: 'rejected',
      startTime: null
    };
  },

  endCall(callData, duration) {
    audioRingingService.stopRingingSound();
    this.stopLocalStream();
    
    // Log to history
    if (callData) {
      callHistoryService.saveCallLog({
        ...callData,
        duration: duration || 0,
        status: callData.status === 'connected' ? 'completed' : callData.status
      });
    }
  },

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  },

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  },

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
};