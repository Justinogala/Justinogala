
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdvancedVideoCall } from '@/context/AdvancedVideoCallContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Sub-components
import ParticipantTile from './ParticipantTile';
import CallControlBar from './CallControlBar';
import CallStatusIndicators from './CallStatusIndicators';
import ScreenShareManager from './ScreenShareManager';
import RaiseHandManager from './RaiseHandManager';
import CallSettingsModal from './CallSettingsModal';

const AdvancedVideoCallInterface = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { 
    activeCall, 
    startCall, 
    endCall,
    participants,
    localStream,
    screenShareStream,
    isScreenSharing,
    callStatus,
    
    // Actions
    toggleMute, isMuted,
    toggleCamera, isCameraOff,
    startScreenShare, stopScreenShare,
    startRecording, stopRecording, isRecording,
    raiseHand, lowerHand, isHandRaised,
    raisedHands
  } = useAdvancedVideoCall();

  useEffect(() => {
    // Auto-join if not already active or if ID mismatch
    if (!activeCall || activeCall.id !== callId) {
      startCall(callId || 'demo-call', 'Team Standup');
    }
  }, [callId]);

  const handleEndCall = () => {
    endCall();
    navigate(-1);
  };

  if (callStatus === 'connecting' || callStatus === 'idle') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-500" />
          <h2 className="text-xl font-semibold">Joining Call...</h2>
          <p className="text-gray-400">Connecting to secure server</p>
        </div>
      </div>
    );
  }

  // Determine Layout
  // If sharing screen, show screen large and participants small on side
  // If no share, grid layout
  const isGrid = !isScreenSharing && participants.length > 0;
  
  return (
    <div className="h-screen w-full bg-gray-950 flex flex-col overflow-hidden relative">
      
      {/* Overlays */}
      <CallStatusIndicators />
      <ScreenShareManager />
      <RaiseHandManager />
      <CallSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-hidden relative flex gap-4">
        
        {/* Main Stage (Screen Share or Grid) */}
        <div className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isScreenSharing ? "flex items-center justify-center bg-black rounded-2xl" : "grid gap-4",
          !isScreenSharing && participants.length === 1 && "grid-cols-1",
          !isScreenSharing && participants.length === 2 && "grid-cols-2",
          !isScreenSharing && participants.length >= 3 && "grid-cols-2 md:grid-cols-3",
          !isScreenSharing && participants.length >= 5 && "grid-cols-3 md:grid-cols-4"
        )}>
          
          {/* Active Screen Share View */}
          {isScreenSharing && screenShareStream && (
             <video 
               autoPlay 
               ref={ref => { if(ref) ref.srcObject = screenShareStream; }} 
               className="max-h-full max-w-full object-contain"
             />
          )}

          {/* Participant Grid (If NOT sharing screen as main view) */}
          {!isScreenSharing && participants.map((p) => (
             <ParticipantTile 
               key={p.id}
               participant={p}
               isLocal={p.isLocal}
               stream={p.isLocal ? localStream : null} // In real app, remote stream here
             />
          ))}
        </div>

        {/* Sidebar (If sharing screen, show participants here) */}
        {isScreenSharing && (
          <div className="w-64 flex flex-col gap-3 overflow-y-auto pr-2">
            {participants.map((p) => (
               <ParticipantTile 
                 key={p.id}
                 participant={p}
                 isLocal={p.isLocal}
                 stream={p.isLocal ? localStream : null}
               />
            ))}
          </div>
        )}

      </div>

      {/* Controls */}
      <CallControlBar 
        isMuted={isMuted} toggleMute={toggleMute}
        isCameraOff={isCameraOff} toggleCamera={toggleCamera}
        isScreenSharing={isScreenSharing} startScreenShare={startScreenShare} stopScreenShare={stopScreenShare}
        isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording}
        isHandRaised={participants.find(p=>p.isLocal)?.isHandRaised} raiseHand={raiseHand} lowerHand={lowerHand}
        onEndCall={handleEndCall}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    </div>
  );
};

export default AdvancedVideoCallInterface;
