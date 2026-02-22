
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { audioRingingService } from '@/services/audioRingingService';

const OutgoingCallScreen = ({ recipientName, onCancel }) => {
  
  useEffect(() => {
    // Start ringing when outgoing screen appears
    audioRingingService.startOutgoingRing();

    // Cleanup on unmount
    return () => {
      audioRingingService.stopRingingSound();
    };
  }, []);

  const handleCancel = () => {
    audioRingingService.stopRingingSound();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center gap-8 w-full max-w-md p-6">
        <div className="relative">
          {/* Ripples */}
          <motion.div 
            animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute inset-0 bg-white/20 rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 bg-white/20 rounded-full"
          />
          
          <Avatar className="w-32 h-32 border-4 border-gray-800 relative z-10">
            <AvatarFallback className="text-4xl bg-gray-700 text-white">
              {recipientName?.[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center space-y-2 z-10">
          <h2 className="text-2xl font-bold text-white">{recipientName}</h2>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            Calling... 
            <span className="animate-pulse">🔊</span>
          </p>
        </div>

        <div className="pt-8">
           <Button 
              size="icon"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-none shadow-lg"
              onClick={handleCancel}
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallScreen;
