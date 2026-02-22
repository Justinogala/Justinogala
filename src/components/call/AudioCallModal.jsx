
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { callHistoryService } from '@/services/callHistoryService';
import CallControls from './CallControls';

const AudioCallModal = ({ isOpen, onClose, callData, onEndCall }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  useEffect(() => {
    let interval;
    if (isOpen && callData?.status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, callData?.status]);

  if (!isOpen || !callData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative"
        >
          {/* Background Ambient Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col items-center p-8 pt-16">
            <div className="relative mb-8">
               <Avatar className="h-32 w-32 border-4 border-white/10 shadow-xl ring-4 ring-violet-500/20">
                 <AvatarImage src={callData.recipient?.avatar} />
                 <AvatarFallback className="text-4xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                   {callData.recipient?.initials || callData.recipient?.name?.[0]}
                 </AvatarFallback>
               </Avatar>
               {callData.status === 'connected' && (
                 <div className="absolute -bottom-2 -right-2 bg-emerald-500 h-6 w-6 rounded-full border-4 border-slate-900 animate-pulse" />
               )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {callData.recipient?.name}
            </h2>
            <p className="text-slate-400 mb-8 font-medium">
              {callData.status === 'connected' ? 'Connected' : 'Calling...'}
            </p>

            <div className="w-full">
               <CallControls
                 isMuted={isMuted}
                 toggleMute={() => setIsMuted(!isMuted)}
                 isSpeakerOn={isSpeakerOn}
                 toggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
                 onEndCall={() => onEndCall(duration)}
                 callDuration={callHistoryService.formatDuration(duration)}
                 showVideoControls={false}
               />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioCallModal;
