
import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const VideoCallScreen = ({ 
  localStream, 
  remoteStream, 
  onEndCall, 
  isAudioOn, 
  isVideoOn, 
  onToggleAudio, 
  onToggleVideo, 
  duration 
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header / Timer */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
        <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-white font-mono text-sm">
          {formatDuration(duration)}
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Remote Video */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {remoteStream ? (
           <video 
             ref={remoteVideoRef} 
             autoPlay 
             playsInline 
             className="w-full h-full object-cover"
           />
        ) : (
           <div className="flex flex-col items-center text-gray-500">
             <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
               <span className="text-3xl font-bold">User</span>
             </div>
             <p>Waiting for video...</p>
           </div>
        )}
      </div>

      {/* PIP Local Video */}
      <motion.div 
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-72 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 z-20 cursor-move"
      >
        {localStream && (
             <video 
             ref={localVideoRef} 
             autoPlay 
             muted 
             playsInline 
             className={`w-full h-full object-cover transform scale-x-[-1] ${!isVideoOn ? 'hidden' : ''}`}
           />
        )}
        {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-xs">
                Camera Off
            </div>
        )}
      </motion.div>

      {/* Controls Bar */}
      <div className="h-20 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 flex items-center justify-center gap-6 z-30 pb-safe">
        <Button 
          size="icon"
          variant={isAudioOn ? "secondary" : "destructive"}
          className="rounded-full w-12 h-12"
          onClick={onToggleAudio}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button 
          size="icon"
          variant="destructive"
          className="rounded-full w-16 h-16 shadow-lg bg-red-600 hover:bg-red-700"
          onClick={onEndCall}
        >
          <PhoneOff className="w-8 h-8" />
        </Button>

        <Button 
          size="icon"
          variant={isVideoOn ? "secondary" : "destructive"}
          className="rounded-full w-12 h-12"
          onClick={onToggleVideo}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCallScreen;
