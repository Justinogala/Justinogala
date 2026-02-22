
import React from 'react';
import { Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ParticipantTile = ({ participant, isLocal, stream, isScreenShare = false, activeBackground }) => {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg group aspect-video isolate",
        participant.isSpeaking && "ring-2 ring-indigo-500"
      )}
    >
       {/* 
         Fallback Background Layer
         Rendered behind the video if provided, to prevent black flashes during transitions 
         or if video has transparency (rare for standard WebRTC but useful for UI)
       */}
       {activeBackground && activeBackground.type === 'image' && (
         <div className="absolute inset-0 -z-10">
           <img 
             src={activeBackground.src} 
             alt="background" 
             className="w-full h-full object-cover opacity-50 blur-sm"
           />
         </div>
       )}

      {/* Video Stream or Avatar Placeholder */}
      {(participant.isCameraOff && !isScreenShare) ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <Avatar className="h-24 w-24 border-4 border-gray-700 shadow-xl">
            <AvatarImage src={participant.avatar} />
            <AvatarFallback className="text-2xl bg-indigo-600 text-white font-bold">
              {getInitials(participant.name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local video to prevent echo
          className={cn(
            "w-full h-full object-cover z-20 relative",
            isLocal && !isScreenShare && "scale-x-[-1]" // Mirror local video
          )}
        />
      )}

      {/* Overlay Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-between items-end z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold drop-shadow-md tracking-wide">
            {participant.name} {isLocal && "(You)"}
            {isScreenShare && " (Screen)"}
          </span>
          {participant.isHandRaised && (
            <div className="bg-yellow-500 p-1 rounded-full animate-bounce shadow-lg">
              <Hand className="w-3 h-3 text-black" />
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
           {participant.isMuted ? (
             <div className="bg-red-500/90 p-1.5 rounded-full backdrop-blur-md shadow-sm">
               <MicOff className="w-3.5 h-3.5 text-white" />
             </div>
           ) : (
             <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors">
               <Mic className="w-3.5 h-3.5 text-white" />
             </div>
           )}
        </div>
      </div>
      
      {/* Network Quality Indicator (Mock) */}
      <div className="absolute top-3 right-3 flex gap-0.5 z-30 opacity-60">
        <div className="w-1 h-3 bg-green-500 rounded-sm shadow-sm"></div>
        <div className="w-1 h-3 bg-green-500 rounded-sm shadow-sm"></div>
        <div className="w-1 h-3 bg-green-500 rounded-sm shadow-sm"></div>
      </div>

    </motion.div>
  );
};

export default ParticipantTile;
