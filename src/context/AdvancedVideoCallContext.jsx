import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { webrtcService } from '@/services/webrtcService';

const AdvancedVideoCallContext = createContext(null);

export const AdvancedVideoCallProvider = ({ children }) => {
  const { toast } = useToast();
  
  // Call State
  const [activeCall, setActiveCall] = useState(null); // { id, title, startTime }
  const [participants, setParticipants] = useState([]); // Array of participant objects
  const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, connected, ended
  const [connectionQuality, setConnectionQuality] = useState('good');
  
  // Local User State
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  // Feature States
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [raisedHands, setRaisedHands] = useState([]); // Array of { userId, timestamp }
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Mock initial participant for testing
  useEffect(() => {
    if (activeCall) {
       // Add self
       setParticipants([
         { id: 'local', name: 'You', isLocal: true, isMuted: false, isCameraOff: false, isHandRaised: false },
         { id: 'p2', name: 'Alice Chen', isLocal: false, isMuted: true, isCameraOff: false, isHandRaised: false },
         { id: 'p3', name: 'Bob Smith', isLocal: false, isMuted: false, isCameraOff: true, isHandRaised: false }
       ]);
    }
  }, [activeCall]);

  const startCall = async (callId, callTitle) => {
    try {
      setCallStatus('connecting');
      const stream = await webrtcService.getLocalStream(true, true);
      setLocalStream(stream);
      setActiveCall({ id: callId, title: callTitle, startTime: Date.now() });
      setCallStatus('connected');
      toast({ title: "Call Started", description: `Joined "${callTitle}"` });
    } catch (error) {
      console.error("Failed to start call", error);
      toast({ variant: "destructive", title: "Error", description: "Could not access camera/microphone" });
      setCallStatus('idle');
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setScreenShareStream(null);
    setActiveCall(null);
    setCallStatus('idle');
    setParticipants([]);
    setIsRecording(false);
    toast({ title: "Call Ended" });
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        updateLocalParticipant({ isMuted: !audioTrack.enabled });
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        updateLocalParticipant({ isCameraOff: !videoTrack.enabled });
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenShareStream(stream);
      setIsScreenSharing(true);
      
      // Handle stop sharing from browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      toast({ title: "Screen Sharing", description: "You are now sharing your screen" });
    } catch (error) {
      console.error("Screen share error", error);
      toast({ variant: "destructive", title: "Error", description: "Could not start screen share" });
    }
  };

  const stopScreenShare = () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
      setScreenShareStream(null);
      setIsScreenSharing(false);
      toast({ title: "Screen Sharing Stopped" });
    }
  };

  const startRecording = () => {
    if (!localStream) return;
    
    // In a real app, we'd record the composite stream or handle cloud recording
    // Here we just record local stream for demo
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(localStream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      toast({ title: "Recording Started", description: "Meeting is being recorded" });
    } catch (error) {
      console.error("Recording error", error);
      toast({ variant: "destructive", title: "Error", description: "Could not start recording" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Simulate save
      setTimeout(() => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        toast({ title: "Recording Saved", description: "Download started automatically" });
      }, 500);
    }
  };

  const raiseHand = () => {
    const newHand = { userId: 'local', timestamp: Date.now(), name: 'You' };
    setRaisedHands(prev => [...prev, newHand]);
    updateLocalParticipant({ isHandRaised: true });
    toast({ title: "Hand Raised", description: "Moderators notified" });
  };

  const lowerHand = (userId = 'local') => {
    setRaisedHands(prev => prev.filter(h => h.userId !== userId));
    if (userId === 'local') {
      updateLocalParticipant({ isHandRaised: false });
    }
  };

  const updateLocalParticipant = (updates) => {
    setParticipants(prev => prev.map(p => p.id === 'local' ? { ...p, ...updates } : p));
  };

  return (
    <AdvancedVideoCallContext.Provider value={{
      activeCall,
      participants,
      callStatus,
      connectionQuality,
      localStream,
      isMuted,
      isCameraOff,
      screenShareStream,
      isScreenSharing,
      isRecording,
      recordingStartTime,
      raisedHands,
      startCall,
      endCall,
      toggleMute,
      toggleCamera,
      startScreenShare,
      stopScreenShare,
      startRecording,
      stopRecording,
      raiseHand,
      lowerHand
    }}>
      {children}
    </AdvancedVideoCallContext.Provider>
  );
};

export const useAdvancedVideoCall = () => {
  const context = useContext(AdvancedVideoCallContext);
  if (!context) {
    throw new Error("useAdvancedVideoCall must be used within AdvancedVideoCallProvider");
  }
  return context;
};