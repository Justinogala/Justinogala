import { useState, useEffect, useRef, useCallback } from 'react';
import { audioRingingService } from '@/services/audioRingingService';

const HISTORY_KEY = 'munal_vc_history';

export const useVideoCall = () => {
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [activeCall, setActiveCall] = useState(null); // { user, type, startTime }
  const [incomingCall, setIncomingCall] = useState(null); // { caller, type }
  const [callDuration, setCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState([]);
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const timerRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setCallHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse call history");
      }
    }
  }, []);

  const saveHistory = (log) => {
    const newHistory = [log, ...callHistory];
    setCallHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setCallHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  // Timer Logic
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  // Actions
  const initiateCall = (user, type) => {
    if (callState !== 'idle') return;
    
    setCallState('calling');
    setActiveCall({ user, type, startTime: Date.now() });
    
    // Simulate connection delay
    audioRingingService.startOutgoingRing();
    
    setTimeout(() => {
      setCallState('connected');
      audioRingingService.stopRingingSound();
    }, 2000);
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    
    audioRingingService.stopRingingSound();
    setActiveCall({ 
      user: incomingCall.caller, 
      type: incomingCall.type, 
      startTime: Date.now() 
    });
    setIncomingCall(null);
    setCallState('connected');
  };

  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    
    audioRingingService.stopRingingSound();
    
    // Log missed call
    saveHistory({
      id: Date.now(),
      user: incomingCall.caller,
      type: incomingCall.type,
      duration: 0,
      status: 'missed',
      timestamp: new Date().toISOString()
    });
    
    setIncomingCall(null);
  };

  const endCall = () => {
    audioRingingService.stopRingingSound();
    
    if (activeCall) {
      // Log completed call
      saveHistory({
        id: Date.now(),
        user: activeCall.user,
        type: activeCall.type,
        duration: callDuration,
        status: 'completed',
        timestamp: new Date().toISOString()
      });
    }

    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setActiveCall(null);
    }, 2000);
  };

  // Simulation of incoming calls
  const simulateIncomingCall = (caller, type = 'audio') => {
    if (callState !== 'idle' || incomingCall) return;
    
    setIncomingCall({ caller, type });
    audioRingingService.startIncomingRing();
    
    // Auto timeout
    setTimeout(() => {
      setIncomingCall(prev => {
        if (prev && prev.caller.id === caller.id) {
           audioRingingService.stopRingingSound();
           saveHistory({
            id: Date.now(),
            user: caller,
            type: type,
            duration: 0,
            status: 'missed',
            timestamp: new Date().toISOString()
          });
          return null;
        }
        return prev;
      });
    }, 15000);
  };

  return {
    callState,
    activeCall,
    incomingCall,
    callDuration,
    callHistory,
    isAudioMuted,
    setIsAudioMuted,
    isVideoOff,
    setIsVideoOff,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    clearHistory,
    simulateIncomingCall
  };
};