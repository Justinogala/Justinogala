import { useState, useEffect, useRef, useCallback } from 'react';
import { webrtcService } from '@/services/webrtcService';

import { getApiUrl, API_URL as API_BASE } from '@/lib/api';

export const useWebRTCCall = (userId, onIncomingCall) => {
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const onIncomingCallRef = useRef(onIncomingCall);
  const pollIntervalRef = useRef(null);

  // Keep the callback ref updated
  useEffect(() => {
    onIncomingCallRef.current = onIncomingCall;
  }, [onIncomingCall]);

  // Set up signal handler for webrtcService to use REST API
  useEffect(() => {
    const sendSignalViaREST = async (message) => {
      const type = message.type;
      const data = message.data || {};
      
      try {
        let endpoint = '';
        let body = {};
        
        switch (type) {
          case 'call_initiate':
            endpoint = '/api/call/initiate';
            body = {
              target_user_id: data.target_user_id,
              call_type: data.call_type,
              call_id: data.call_id
            };
            break;
            
          case 'call_accept':
            endpoint = '/api/call/accept';
            body = {
              caller_id: data.caller_id,
              call_id: data.call_id,
              target_user_id: userId
            };
            break;
            
          case 'call_reject':
            endpoint = '/api/call/reject';
            body = {
              caller_id: data.caller_id,
              call_id: data.call_id,
              target_user_id: userId
            };
            break;
            
          case 'call_end':
            endpoint = '/api/call/end';
            body = {
              target_user_id: data.target_user_id,
              call_id: data.call_id,
              caller_id: userId
            };
            break;
            
          case 'webrtc_offer':
            endpoint = '/api/call/signal';
            body = {
              call_id: data.call_id,
              caller_id: userId,
              target_user_id: data.target_user_id,
              signal_type: 'offer',
              signal_data: data.offer
            };
            break;
            
          case 'webrtc_answer':
            endpoint = '/api/call/signal';
            body = {
              call_id: data.call_id,
              caller_id: userId,
              target_user_id: data.target_user_id,
              signal_type: 'answer',
              signal_data: data.answer
            };
            break;
            
          case 'webrtc_ice_candidate':
            endpoint = '/api/call/signal';
            body = {
              call_id: data.call_id,
              caller_id: userId,
              target_user_id: data.target_user_id,
              signal_type: 'ice_candidate',
              signal_data: data.candidate
            };
            break;
            
          default:
            console.warn('[WebRTC] Unknown signal type:', type);
            return;
        }
        
        // Add caller_id to initiate call
        if (type === 'call_initiate') {
          endpoint += `?caller_id=${userId}`;
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          console.error('[WebRTC] Signal failed:', await response.text());
        } else {
          const result = await response.json();
          // Handle offline user for call initiation
          if (type === 'call_initiate' && !result.success) {
            console.warn('[WebRTC] Call failed:', result.error);
            webrtcService.cleanup();
            setCurrentCall(null);
            setLocalStream(null);
            // Notify caller the user is offline
            if (result.reason === 'offline') {
              window.__callError?.('User is currently offline and cannot receive calls.');
            }
          }
          console.log('[WebRTC] Signal sent:', type);
        }
      } catch (error) {
        console.error('[WebRTC] Error sending signal:', error);
      }
    };
    
    webrtcService.setSignalHandler(sendSignalViaREST);
    setIsCallConnected(true);
  }, [userId]);

  // Handle incoming call signals from SSE (set up in WebSocketChatContext)
  const handleCallSignal = useCallback(async (data) => {
    console.log('[WebRTC] Received call signal:', data.type);
    
    switch (data.type) {
      case 'incoming_call':
        onIncomingCallRef.current?.(data.data);
        break;
        
      case 'call_accepted':
        // Clear call timeout since the call was answered
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
        if (webrtcService.currentCall) {
          webrtcService.currentCall.status = 'connecting';
          setCurrentCall({ ...webrtcService.currentCall });
          await webrtcService.createOffer(data.data.accepted_by);
        }
        break;
        
      case 'call_rejected':
        webrtcService.cleanup();
        setCurrentCall(null);
        setLocalStream(null);
        break;
        
      case 'call_ended':
        webrtcService.cleanup();
        setCurrentCall(null);
        setLocalStream(null);
        setRemoteStream(null);
        break;
        
      case 'webrtc_offer':
        await webrtcService.handleOffer(data.data.from_user_id, data.data.offer);
        break;
        
      case 'webrtc_answer':
        await webrtcService.handleAnswer(data.data.answer);
        break;
        
      case 'webrtc_ice_candidate':
        await webrtcService.handleIceCandidate(data.data.ice_candidate);
        break;
        
      default:
        break;
    }
  }, []);

  // Expose handleCallSignal for external use (from SSE events)
  useEffect(() => {
    window.__webrtcCallHandler = handleCallSignal;
    return () => {
      delete window.__webrtcCallHandler;
    };
  }, [handleCallSignal]);

  // Set up webrtcService callbacks
  useEffect(() => {
    webrtcService.setCallbacks({
      onCallStateChange: (call) => {
        setCurrentCall(call ? { ...call } : null);
      },
      onLocalStream: (stream) => {
        setLocalStream(stream);
      },
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
      }
    });
  }, []);

  const callTimeoutRef = useRef(null);

  // Initiate a call
  const initiateCall = useCallback(async (targetUserId, callType = 'audio') => {
    try {
      const call = await webrtcService.initiateCall(targetUserId, callType);
      setCurrentCall({ ...call });
      
      // Set a 30-second timeout for unanswered calls
      callTimeoutRef.current = setTimeout(() => {
        if (webrtcService.currentCall?.status === 'ringing') {
          console.warn('[WebRTC] Call timeout - no answer');
          webrtcService.cleanup();
          setCurrentCall(null);
          setLocalStream(null);
          window.__callError?.('No answer. The user did not pick up.');
        }
      }, 30000);
      
      return call;
    } catch (error) {
      console.error('[WebRTC] Error initiating call:', error);
      throw error;
    }
  }, []);

  // Accept incoming call
  const acceptCall = useCallback(async (callerId, callId, callType) => {
    try {
      const call = await webrtcService.acceptCall(callerId, callId, callType);
      setCurrentCall({ ...call });
      return call;
    } catch (error) {
      console.error('[WebRTC] Error accepting call:', error);
      throw error;
    }
  }, []);

  // Reject incoming call
  const rejectCall = useCallback((callerId, callId) => {
    webrtcService.rejectCall(callerId, callId);
    setCurrentCall(null);
  }, []);

  // End current call
  const endCall = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    webrtcService.endCall();
    setCurrentCall(null);
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback((enabled) => {
    return webrtcService.toggleAudio(enabled);
  }, []);

  // Toggle video
  const toggleVideo = useCallback((enabled) => {
    return webrtcService.toggleVideo(enabled);
  }, []);

  return {
    isCallConnected,
    currentCall,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    handleCallSignal
  };
};

export default useWebRTCCall;
