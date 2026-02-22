import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCallState } from '@/context/CallStateContext';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { audioRingingService } from '@/services/audioRingingService';
import { backgroundProcessor } from '@/services/BackgroundProcessor';
import { useBackgroundManager } from '@/hooks/useBackgroundManager';

// Components
import ParticipantTile from './ParticipantTile';
import CallControlBar from './CallControlBar';
import CallStatusIndicators from './CallStatusIndicators';
import ScreenShareManager from './ScreenShareManager';
import RaiseHandManager from './RaiseHandManager';
import CallSettingsModal from './CallSettingsModal';
import CallEndDialog from './CallEndDialog';

const FullScreenVideoCallView = () => {
  const { 
    activeCall, 
    participants, 
    localStream, 
    screenShareStream, 
    isScreenSharing, 
    setShowEndDialog,
    isMuted, toggleMute,
    isCameraOff, toggleCamera,
    startScreenShare, stopScreenShare,
    isRecording, startRecording, stopRecording,
    raiseHand, lowerHand
  } = useCallState();

  const { activeBackground, selectBackground } = useBackgroundManager();
  const [processedStream, setProcessedStream] = useState(null);
  const hiddenVideoRef = useRef(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Background Processing Logic
  useEffect(() => {
    // 1. If we have a local stream and a video element reference
    if (localStream && hiddenVideoRef.current && !isCameraOff) {
      
      // Set the source for the hidden video element
      hiddenVideoRef.current.srcObject = localStream;
      hiddenVideoRef.current.play().catch(e => console.log('Autoplay blocked', e));

      // Initialize processor if not already running
      if (!backgroundProcessor.sourceVideo) {
         const stream = backgroundProcessor.initialize(hiddenVideoRef.current);
         setProcessedStream(stream);
      }
      
      // Update effect
      backgroundProcessor.setEffect(activeBackground);
      
    } else {
      // If camera is off or stream is gone, stop processing to save resources
      if (processedStream || backgroundProcessor.sourceVideo) {
        backgroundProcessor.stop();
        setProcessedStream(null);
      }
    }

    // Cleanup handled by component unmount mostly, but we can be reactive here
  }, [localStream, isCameraOff, activeBackground]);

  // Handle effect changes separately if processor is already running
  useEffect(() => {
    if (backgroundProcessor.sourceVideo) {
      backgroundProcessor.setEffect(activeBackground);
    }
  }, [activeBackground]);


  // Ensure ringing is stopped when call is connected/active
  useEffect(() => {
    if (activeCall) {
      audioRingingService.stopRingingSound();
    }
    return () => {
      audioRingingService.stopRingingSound();
    };
  }, [activeCall]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!activeCall) return null;

  // Decide which stream to show for local user
  // If processing is active, show processed stream. Otherwise raw stream.
  const effectiveLocalStream = processedStream || localStream;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute inset-0 z-40 bg-gray-950 flex flex-col overflow-hidden"
    >
      {/* Hidden video element for background processing source */}
      <video 
        ref={hiddenVideoRef} 
        className="hidden" 
        muted 
        playsInline 
      />

      {/* Top Overlays */}
      <CallStatusIndicators />
      <ScreenShareManager />
      <RaiseHandManager />
      
      {/* Modals */}
      <CallSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CallEndDialog />

      {/* Main Grid Area */}
      <div className="flex-1 p-4 relative flex items-center justify-center">
        
        {/* Screen Share Mode */}
        {isScreenSharing && (
          <div className="flex w-full h-full gap-4">
            <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative">
              {screenShareStream ? (
                <video 
                  autoPlay 
                  ref={ref => { if(ref) ref.srcObject = screenShareStream; }} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">Initializing share...</div>
              )}
            </div>
            
            {/* Sidebar Participants */}
            <div className="w-64 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
              {participants.map((p) => (
                <ParticipantTile 
                  key={p.id}
                  participant={p}
                  isLocal={p.isLocal}
                  stream={p.isLocal ? effectiveLocalStream : null}
                  activeBackground={p.isLocal ? activeBackground : null}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Grid Mode */}
        {!isScreenSharing && (
          <div className={cn(
            "grid gap-4 w-full h-full max-w-7xl mx-auto transition-all duration-500",
            participants.length === 1 && "grid-cols-1",
            participants.length === 2 && "grid-cols-1 md:grid-cols-2",
            participants.length >= 3 && participants.length <= 4 && "grid-cols-2",
            participants.length > 4 && participants.length <= 9 && "grid-cols-2 md:grid-cols-3",
            participants.length > 9 && "grid-cols-3 md:grid-cols-4"
          )}>
            <AnimatePresence>
              {participants.map((p) => (
                <ParticipantTile 
                  key={p.id}
                  participant={p}
                  isLocal={p.isLocal}
                  stream={p.isLocal ? effectiveLocalStream : null}
                  activeBackground={p.isLocal ? activeBackground : null}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Fullscreen Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 z-50"
          onClick={toggleBrowserFullscreen}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Control Bar */}
      <CallControlBar 
        isMuted={isMuted} toggleMute={toggleMute}
        isCameraOff={isCameraOff} toggleCamera={toggleCamera}
        isScreenSharing={isScreenSharing} startScreenShare={startScreenShare} stopScreenShare={stopScreenShare}
        isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording}
        isHandRaised={participants.find(p=>p.isLocal)?.isHandRaised} raiseHand={raiseHand} lowerHand={lowerHand}
        onEndCall={() => setShowEndDialog(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleParticipants={() => {}} 
        onToggleChat={() => {}}
      />
    </motion.div>
  );
};

export default FullScreenVideoCallView;