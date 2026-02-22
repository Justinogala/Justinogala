
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Video, X, BellOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { audioRingingService } from '@/services/audioRingingService';
import { useCallRingtone } from '@/hooks/useCallRingtone';

const IncomingCallNotification = ({ callerName, onAccept, onDecline }) => {
  const { ringtoneType } = useCallRingtone();

  useEffect(() => {
    // Start ringing when notification appears
    audioRingingService.startIncomingRing(ringtoneType);

    // Cleanup when notification is dismissed/handled
    return () => {
      audioRingingService.stopRingingSound();
    };
  }, [ringtoneType]);

  const handleAccept = () => {
    audioRingingService.stopRingingSound();
    onAccept();
  };

  const handleDecline = () => {
    audioRingingService.stopRingingSound();
    onDecline();
  };

  const handleMute = (e) => {
    e.stopPropagation();
    audioRingingService.toggleMute(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Visual Alert for Accessibility */}
      <motion.div 
        className="absolute inset-0 border-[20px] border-indigo-500/20"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-8 max-w-sm w-full p-6 relative"
      >
        <Button 
           variant="ghost" 
           size="icon" 
           className="absolute top-0 right-0 text-white/50 hover:text-white"
           onClick={handleMute}
           aria-label="Mute Ringtone"
        >
          <BellOff className="w-6 h-6" />
        </Button>

        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-indigo-500 rounded-full blur-xl"
          />
          <Avatar className="w-32 h-32 border-4 border-white dark:border-slate-800 relative z-10 shadow-2xl">
            <AvatarFallback className="text-4xl bg-indigo-600 text-white">
              {callerName?.[0] || 'Unknown'}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center space-y-2 z-10">
          <h2 className="text-3xl font-bold text-white">{callerName || 'Unknown Caller'}</h2>
          <p className="text-indigo-200 animate-pulse flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></span>
            Incoming Video Call...
          </p>
        </div>

        <div className="flex gap-8 w-full justify-center z-10 pt-4">
          <div className="flex flex-col items-center gap-2">
            <Button 
              size="icon"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-none shadow-lg transition-transform hover:scale-110"
              onClick={handleDecline}
            >
              <X className="w-8 h-8" />
            </Button>
            <span className="text-sm text-gray-400">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button 
              size="icon"
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 border-none shadow-lg transition-transform hover:scale-110"
              onClick={handleAccept}
            >
              <Video className="w-8 h-8" />
            </Button>
            <span className="text-sm text-gray-400">Accept</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default IncomingCallNotification;
