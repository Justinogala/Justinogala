import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VideoCallModal = ({ 
  isOpen, 
  activeCall, 
  duration, 
  onEndCall, 
  isMuted, 
  toggleMute,
  isVideoOff,
  toggleVideo,
  callState 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !activeCall) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const seconds = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${seconds}`;
  };

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

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Remote Video Area (Main) */}
        <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
          {callState === 'connected' ? (
             <div className="w-full h-full relative">
               {/* Mock Remote Video Feed */}
               <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                 <Avatar className="h-48 w-48 opacity-20">
                   <AvatarFallback className="text-8xl">{activeCall.user.initials}</AvatarFallback>
                 </Avatar>
                 <p className="absolute bottom-1/3 text-slate-500">Camera off (Simulation)</p>
               </div>
               
               {/* User Info Overlay */}
               <div className="absolute top-8 left-8 flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                 <div className="flex flex-col">
                   <span className="text-white font-bold">{activeCall.user.name}</span>
                   <span className="text-xs text-emerald-400 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                     {formatTime(duration)}
                   </span>
                 </div>
               </div>
             </div>
          ) : (
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-6 ring-4 ring-white/10">
                 <AvatarFallback className={cn("text-4xl text-white", activeCall.user.color)}>
                   {activeCall.user.initials}
                 </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl text-white font-bold mb-2">{activeCall.user.name}</h2>
              <p className="text-slate-400 animate-pulse">Calling...</p>
            </div>
          )}

          {/* Local Video Preview (PiP) */}
          <motion.div 
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="absolute bottom-24 right-8 w-48 h-32 bg-slate-800 rounded-xl border border-white/20 shadow-2xl overflow-hidden z-20"
          >
            {isVideoOff ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                <VideoOff className="w-8 h-8 opacity-50" />
              </div>
            ) : (
              <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                <User className="w-12 h-12 text-slate-500" />
                <span className="absolute bottom-2 right-2 text-[10px] text-white/50">You</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Controls Bar */}
        <div className="h-24 bg-black/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-center gap-6 px-8 relative z-30">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full",
              isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
            )}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full",
              isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20"
            )}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 mx-4 transform hover:scale-105 transition-all"
            onClick={onEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 absolute right-8"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallModal;