import { useState, useEffect, useRef, useCallback } from 'react';
import { webrtcService } from '@/services/webrtcService';

const API_BASE = window.location.origin;

export const useWebRTCCall = (userId, onIncomingCall) => {
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onIncomingCallRef = useRef(onIncomingCall);

  // Keep the callback ref updated
  useEffect(() => {
    onIncomingCallRef.current = onIncomingCall;
  }, [onIncomingCall]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (data) => {
    console.log('[WebRTC] Received signal:', data.type);
    
    switch (data.type) {
      case 'incoming_call':
        onIncomingCallRef.current?.(data.data);
        break;
        
      case 'call_accepted':
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
        await webrtcService.handleIceCandidate(data.data.candidate);
        break;
        
      default:
        break;
    }
  }, []);

  // Connect WebSocket for signaling
  useEffect(() => {
    if (!userId) return;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat/${userId}`;
      
      console.log('[WebRTC] Connecting WebSocket for signaling:', wsUrl);
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('[WebRTC] WebSocket connected');
          setIsCallConnected(true);
          
          webrtcService.setSignalHandler((message) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(message));
            }
          });
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleSignalingMessage(data);
        };

        ws.onerror = (error) => {
          console.error('[WebRTC] WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('[WebRTC] WebSocket closed');
          setIsCallConnected(false);
          wsRef.current = null;
          
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('[WebRTC] WebSocket connection failed:', err);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId, handleSignalingMessage]);

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

  // Initiate a call
  const initiateCall = useCallback(async (targetUserId, callType = 'audio') => {
    try {
      const call = await webrtcService.initiateCall(targetUserId, callType);
      setCurrentCall({ ...call });
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
    toggleVideo
  };
};

export default useWebRTCCall;
