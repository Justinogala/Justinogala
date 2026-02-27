import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, 
  X, Maximize2, Minimize2, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const CallInterface = ({ 
  call, 
  localStream, 
  remoteStream, 
  user,
  onEndCall,
  onToggleAudio,
  onToggleVideo 
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call?.callType === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Set up video streams
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

  // Call duration timer
  useEffect(() => {
    let interval;
    if (call?.status === 'connected' && call?.startTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - call.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [call?.status, call?.startTime]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    onToggleAudio?.(newState);
  };

  const handleToggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    onToggleVideo?.(newState);
  };

  const getStatusText = () => {
    switch (call?.status) {
      case 'ringing': return call.isOutgoing ? 'Calling...' : 'Incoming call';
      case 'connecting': return 'Connecting...';
      case 'connected': return formatDuration(callDuration);
      default: return '';
    }
  };

  const isVideoCall = call?.callType === 'video';

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 right-6 z-50"
      >
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/10">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-emerald-400">{getStatusText()}</p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-white hover:bg-white/10"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              className="h-8 w-8 bg-red-500 hover:bg-red-600"
              onClick={onEndCall}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              call?.status === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-bounce"
            )} />
            <span className="text-white font-medium">
              {isVideoCall ? 'Video Call' : 'Audio Call'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Remote Video/Avatar */}
          {isVideoCall && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ scale: call?.status === 'ringing' ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: call?.status === 'ringing' ? Infinity : 0, duration: 1.5 }}
              >
                <Avatar className="h-32 w-32 ring-4 ring-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-4xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mt-6">{user?.name}</h2>
              <p className="text-gray-400 mt-2">{getStatusText()}</p>
              
              {call?.status === 'ringing' && !call.isOutgoing && (
                <p className="text-emerald-400 mt-1 animate-pulse">
                  {isVideoCall ? 'Video call' : 'Audio call'}
                </p>
              )}
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {isVideoCall && localStream && (
            <div className="absolute bottom-24 right-6 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-8">
          <div className="flex items-center justify-center gap-4">
            {/* Mute Button */}
            <Button
              size="lg"
              variant={isAudioEnabled ? "secondary" : "destructive"}
              className={cn(
                "h-14 w-14 rounded-full",
                isAudioEnabled 
                  ? "bg-white/10 hover:bg-white/20 text-white" 
                  : "bg-red-500 hover:bg-red-600"
              )}
              onClick={handleToggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>

            {/* Video Toggle (only for video calls) */}
            {isVideoCall && (
              <Button
                size="lg"
                variant={isVideoEnabled ? "secondary" : "destructive"}
                className={cn(
                  "h-14 w-14 rounded-full",
                  isVideoEnabled 
                    ? "bg-white/10 hover:bg-white/20 text-white" 
                    : "bg-red-500 hover:bg-red-600"
                )}
                onClick={handleToggleVideo}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
            )}

            {/* End Call Button */}
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
              onClick={onEndCall}
            >
              <PhoneOff className="w-7 h-7" />
            </Button>
          </div>

          {/* Connection status */}
          {call?.status === 'connecting' && (
            <p className="text-center text-gray-400 mt-4 text-sm">
              Establishing secure connection...
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallInterface;
