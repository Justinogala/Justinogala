import React, { createContext, useContext, useState, useEffect } from 'react';
import { webrtcCallService } from '@/services/webrtcCallService';
import { useToast } from '@/components/ui/use-toast';
import { callHistoryService } from '@/services/callHistoryService';

// Import our new components so they are available or rendered by a layout wrapper if we wanted
// But typically context just provides state. We'll stick to state here.

const CallStateContext = createContext(null);

export const CallStateProvider = ({ children }) => {
  const { toast } = useToast();
  
  // State
  const [currentCall, setCurrentCall] = useState(null); // { id, status, type, caller, recipient }
  const [incomingCall, setIncomingCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);

  // Load history on mount
  useEffect(() => {
    setCallHistory(callHistoryService.getCallHistory());
  }, []);

  const startAudioCall = (caller, recipient) => {
    if (currentCall) return;
    const call = webrtcCallService.initiateCall(caller, recipient, 'audio');
    setCurrentCall({ ...call, recipient }); // Ensure recipient info is available for modal
  };

  const startVideoCall = (caller, recipient) => {
    if (currentCall) return;
    const call = webrtcCallService.initiateCall(caller, recipient, 'video');
    setCurrentCall({ ...call, recipient });
  };

  const acceptIncomingCall = () => {
    if (incomingCall) {
      const activeCall = webrtcCallService.acceptCall(incomingCall.id);
      setCurrentCall({ ...incomingCall, ...activeCall, status: 'connected' });
      setIncomingCall(null);
    }
  };

  const rejectIncomingCall = () => {
    if (incomingCall) {
      webrtcCallService.rejectCall(incomingCall.id);
      callHistoryService.saveCallLog({
        ...incomingCall,
        status: 'missed',
        duration: 0
      });
      setIncomingCall(null);
      refreshHistory();
    }
  };

  const endCurrentCall = (duration) => {
    if (currentCall) {
      webrtcCallService.endCall(currentCall, duration);
      setCurrentCall(null);
      refreshHistory();
      toast({ title: "Call Ended", description: `Duration: ${callHistoryService.formatDuration(duration)}` });
    }
  };

  const refreshHistory = () => {
    setCallHistory(callHistoryService.getCallHistory());
  };

  // Simulation helper for demo
  const simulateIncomingCall = (caller) => {
    const call = {
      id: `inc_${Date.now()}`,
      caller,
      type: Math.random() > 0.5 ? 'video' : 'audio',
      status: 'ringing',
      timestamp: new Date().toISOString()
    };
    setIncomingCall(call);
    
    // Auto-timeout after 30s
    setTimeout(() => {
      setIncomingCall(prev => {
        if (prev && prev.id === call.id) return null;
        return prev;
      });
    }, 30000);
  };

  return (
    <CallStateContext.Provider value={{
      currentCall,
      incomingCall,
      callHistory,
      isCallHistoryOpen,
      setIsCallHistoryOpen,
      startAudioCall,
      startVideoCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCurrentCall,
      simulateIncomingCall,
      refreshHistory
    }}>
      {children}
    </CallStateContext.Provider>
  );
};

export const useCallState = () => {
  const context = useContext(CallStateContext);
  if (!context) {
    throw new Error("useCallState must be used within CallStateProvider");
  }
  return context;
};