
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { webrtcCallService } from '@/services/webrtcCallService';
import { callHistoryService } from '@/services/callHistoryService';
import CallControls from './CallControls';

const VideoCallModal = ({ isOpen, onClose, callData, onEndCall }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef(null);

  // Initialize Media
  useEffect(() => {
    if (isOpen) {
      const startMedia = async () => {
        try {
          const stream = await webrtcCallService.getLocalStream('video');
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Failed to get local stream", error);
        }
      };
      startMedia();
    }
    return () => {
      webrtcCallService.stopLocalStream();
    };
  }, [isOpen]);

  // Duration Timer
  useEffect(() => {
    let interval;
    if (isOpen && callData?.status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callData?.status]);

  const toggleFullscreen = () => {
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

  const handleToggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    webrtcCallService.toggleVideo(newState);
  };

  const handleToggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    webrtcCallService.toggleAudio(!newState);
  };

  if (!isOpen || !callData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black flex flex-col"
      >
        {/* Main Remote Video Area (Simulated for demo with placeholder) */}
        <div className="flex-1 relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-center">
               <Avatar className="h-40 w-40 mx-auto mb-4 border-4 border-white/10">
                 <AvatarFallback className="text-5xl bg-violet-600 text-white">
                    {callData.recipient?.initials || 'U'}
                 </AvatarFallback>
               </Avatar>
               <h2 className="text-3xl font-bold text-white">{callData.recipient?.name}</h2>
               <p className="text-slate-400 mt-2 text-xl">{callData.status === 'connected' ? 'Connected' : 'Calling...'}</p>
             </div>
          </div>
          
          {/* Local Video PIP */}
          <motion.div 
            drag
            dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
            className="absolute top-6 right-6 w-48 h-64 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20 cursor-move z-20"
          >
             <video 
               ref={localVideoRef} 
               autoPlay 
               muted 
               playsInline 
               className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`} 
             />
             {!isVideoEnabled && (
               <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                 <span className="text-xs">Camera Off</span>
               </div>
             )}
          </motion.div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
           <CallControls 
              isMuted={isMuted}
              toggleMute={handleToggleMute}
              isVideoEnabled={isVideoEnabled}
              toggleVideo={handleToggleVideo}
              isSpeakerOn={isSpeakerOn}
              toggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
              onEndCall={() => onEndCall(duration)}
              callDuration={callHistoryService.formatDuration(duration)}
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
           />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallModal;
