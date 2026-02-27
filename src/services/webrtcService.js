// Enhanced WebRTC Service for Audio/Video Calls with Signaling
import { v4 as uuidv4 } from 'uuid';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCall = null;
    this.onCallStateChange = null;
    this.onRemoteStream = null;
    this.onLocalStream = null;
    this.sendSignal = null;
    this.config = { iceServers: ICE_SERVERS };
  }

  setSignalHandler(handler) {
    this.sendSignal = handler;
  }

  setCallbacks({ onCallStateChange, onRemoteStream, onLocalStream }) {
    if (onCallStateChange) this.onCallStateChange = onCallStateChange;
    if (onRemoteStream) this.onRemoteStream = onRemoteStream;
    if (onLocalStream) this.onLocalStream = onLocalStream;
  }

  async initiateCall(targetUserId, callType = 'audio') {
    const callId = uuidv4();
    
    this.currentCall = {
      id: callId,
      targetUserId,
      callType,
      status: 'initiating',
      isOutgoing: true,
      startTime: null
    };

    try {
      // Get local media stream
      await this.getLocalStream(callType === 'video', true);
      
      // Update call status
      this.currentCall.status = 'ringing';
      this.onCallStateChange?.(this.currentCall);

      // Send call initiation signal
      this.sendSignal?.({
        type: 'call_initiate',
        data: {
          target_user_id: targetUserId,
          call_type: callType,
          call_id: callId
        }
      });

      return this.currentCall;
    } catch (error) {
      console.error('Error initiating call:', error);
      this.cleanup();
      throw error;
    }
  }

  async acceptCall(callerId, callId, callType) {
    this.currentCall = {
      id: callId,
      targetUserId: callerId,
      callType,
      status: 'connecting',
      isOutgoing: false,
      startTime: null
    };

    try {
      // Get local media stream
      await this.getLocalStream(callType === 'video', true);
      
      this.onCallStateChange?.(this.currentCall);

      // Send accept signal
      this.sendSignal?.({
        type: 'call_accept',
        data: {
          caller_id: callerId,
          call_id: callId
        }
      });

      return this.currentCall;
    } catch (error) {
      console.error('Error accepting call:', error);
      this.cleanup();
      throw error;
    }
  }

  rejectCall(callerId, callId) {
    this.sendSignal?.({
      type: 'call_reject',
      data: {
        caller_id: callerId,
        call_id: callId
      }
    });
    this.cleanup();
  }

  async getLocalStream(video = true, audio = true) {
    try {
      const constraints = {
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
        audio: audio
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.onLocalStream?.(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Could not access microphone/camera. Please check permissions.');
    }
  }

  async createPeerConnection(targetUserId) {
    this.peerConnection = new RTCPeerConnection(this.config);

    // Add local tracks to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal?.({
          type: 'webrtc_ice_candidate',
          data: {
            target_user_id: targetUserId,
            call_id: this.currentCall?.id,
            candidate: event.candidate
          }
        });
      }
    };

    // Monitor connection state
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('WebRTC Connection state:', state);
      
      if (state === 'connected' && this.currentCall) {
        this.currentCall.status = 'connected';
        this.currentCall.startTime = Date.now();
        this.onCallStateChange?.(this.currentCall);
      } else if (state === 'disconnected' || state === 'failed') {
        this.endCall();
      }
    };

    // ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE Connection state:', this.peerConnection?.iceConnectionState);
    };

    return this.peerConnection;
  }

  async createOffer(targetUserId) {
    if (!this.peerConnection) {
      await this.createPeerConnection(targetUserId);
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.sendSignal?.({
      type: 'webrtc_offer',
      data: {
        target_user_id: targetUserId,
        call_id: this.currentCall?.id,
        offer: offer
      }
    });
  }

  async handleOffer(fromUserId, offer) {
    if (!this.peerConnection) {
      await this.createPeerConnection(fromUserId);
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.sendSignal?.({
      type: 'webrtc_answer',
      data: {
        target_user_id: fromUserId,
        call_id: this.currentCall?.id,
        answer: answer
      }
    });
  }

  async handleAnswer(answer) {
    if (this.peerConnection && this.peerConnection.signalingState !== 'stable') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate(candidate) {
    if (this.peerConnection && candidate) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  endCall() {
    if (this.currentCall && this.sendSignal) {
      this.sendSignal({
        type: 'call_end',
        data: {
          target_user_id: this.currentCall.targetUserId,
          call_id: this.currentCall.id
        }
      });
    }
    this.cleanup();
  }

  cleanup() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    
    if (this.currentCall) {
      const endedCall = { ...this.currentCall, status: 'ended' };
      this.currentCall = null;
      this.onCallStateChange?.(endedCall);
    }
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      return enabled;
    }
    return false;
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      return enabled;
    }
    return false;
  }

  getCurrentCall() {
    return this.currentCall;
  }

  isInCall() {
    return this.currentCall !== null && ['ringing', 'connecting', 'connected'].includes(this.currentCall.status);
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;
