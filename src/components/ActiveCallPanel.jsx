import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useNavigate } from 'react-router-dom';
import { audioRingingService } from '@/services/audioRingingService';

const ActiveCallPanel = ({ call, onEndCall }) => {
  const { 
    callState, 
    localStream, 
    remoteStream, 
    isAudioEnabled, 
    isVideoEnabled, 
    callDuration,
    initiateCall,
    endCall,
    toggleAudio,
    toggleVideo
  } = useVideoCall();

  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef(null);
  const navigate = useNavigate();

  // IMPORTANT: Stop any ringing when this component mounts (call is active)
  useEffect(() => {
    audioRingingService.stopRingingSound();
  }, []);

  // Initialize hook if needed based on props
  useEffect(() => {
    if (call && callState === 'idle') {
      // initiateCall(call.type === 'video'); // This might double-trigger if not careful
    }
  }, [call]);

  // Sync refs
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    audioRingingService.stopRingingSound();
    endCall();
    onEndCall();
  };

  if (!call) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        height: isMinimized ? 'auto' : 'auto',
        width: isMinimized ? '300px' : '100%'
      }}
      className={`bg-gray-900 text-white rounded-xl shadow-xl overflow-hidden mb-4 transition-all border border-gray-800 ${
        isMinimized ? 'absolute bottom-20 right-6 z-40' : 'relative'
      }`}
    >
      {/* Compact Video Preview for Chat */}
      {!isMinimized && call.type === 'video' && (
        <div className="h-48 bg-black flex items-center justify-center relative overflow-hidden">
            {/* We show local stream here as a preview since full video screen isn't open */}
           {localStream ? (
             <video 
               ref={localVideoRef} 
               autoPlay 
               muted 
               playsInline 
               className="w-full h-full object-cover"
             />
           ) : (
             <Avatar className="w-16 h-16">
               <AvatarFallback className="bg-indigo-600 text-xl">{call.caller?.name?.[0]}</AvatarFallback>
             </Avatar>
           )}
           <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
             <Button 
               size="sm" 
               variant="outline" 
               className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
               onClick={() => navigate('/video-call')}
             >
               <Maximize2 className="w-4 h-4 mr-2" />
               Full Screen
             </Button>
           </div>
        </div>
      )}

      <div className="p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarFallback className="bg-indigo-600 text-xs">{call.caller?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{call.caller?.name || 'Unknown'}</h3>
              <p className="text-[10px] text-indigo-300 font-mono">
                {call.status === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} className="h-6 w-6 text-gray-400 hover:text-white">
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
        </div>

        <div className="flex justify-center gap-3">
          <Button 
            variant="ghost"
            size="icon" 
            className={`rounded-full w-10 h-10 ${!isAudioEnabled ? 'bg-white text-gray-900' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={toggleAudio}
          >
            {!isAudioEnabled ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          
          {call.type === 'video' && (
            <Button 
              variant="ghost"
              size="icon" 
              className={`rounded-full w-10 h-10 ${!isVideoEnabled ? 'bg-white text-gray-900' : 'bg-white/10 hover:bg-white/20'}`}
              onClick={toggleVideo}
            >
              {!isVideoEnabled ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>
          )}

          <Button 
            variant="destructive" 
            size="icon" 
            className="rounded-full w-10 h-10 bg-red-500 hover:bg-red-600"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveCallPanel;