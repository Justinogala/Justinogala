import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AudioCallModal = ({ 
  isOpen, 
  activeCall, 
  duration, 
  onEndCall, 
  isMuted, 
  toggleMute,
  callState 
}) => {
  if (!isOpen || !activeCall) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const seconds = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${seconds}`;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-black p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden"
        >
          {/* Animated Background Pulse */}
          {callState === 'calling' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/20 rounded-full animate-ping blur-3xl duration-1000" />
          )}

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-8 relative">
              <Avatar className="h-32 w-32 ring-4 ring-white/10 shadow-2xl">
                <AvatarImage src={activeCall.user.avatar} />
                <AvatarFallback className={cn("text-4xl text-white", activeCall.user.color)}>
                  {activeCall.user.initials}
                </AvatarFallback>
              </Avatar>
              {callState === 'connected' && (
                <div className="absolute bottom-1 right-1 h-6 w-6 bg-emerald-500 rounded-full border-4 border-black" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 text-center">{activeCall.user.name}</h2>
            <p className="text-violet-300 font-medium mb-8">
              {callState === 'calling' ? 'Calling...' : 
               callState === 'connected' ? formatTime(duration) : 
               'Call Ended'}
            </p>

            <div className="grid grid-cols-3 gap-6 w-full max-w-[240px]">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full border-none transition-all duration-200",
                  isMuted ? "bg-white text-slate-900 hover:bg-slate-200" : "bg-white/10 text-white hover:bg-white/20"
                )}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full border-none bg-white/10 text-white hover:bg-white/20"
              >
                <Volume2 className="h-6 w-6" />
              </Button>
              
              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40"
                onClick={onEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioCallModal;