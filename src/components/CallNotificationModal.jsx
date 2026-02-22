import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X, PhoneIncoming, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCallState } from '@/context/CallStateContext';
import { audioRingingService } from '@/services/audioRingingService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CallNotificationModal = () => {
  const { incomingCall, acceptIncomingCall, declineIncomingCall } = useCallState();
  
  // Visual pulse sync setup
  const pulseVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: { 
      scale: [1, 1.05, 1], 
      opacity: [0.5, 0.8, 0.5],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } // Matches standard ring cycle roughly
    }
  };

  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 right-4 z-[100] w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ring-2 ring-offset-2 ring-indigo-500"
      >
        <div className="p-6 flex flex-col items-center gap-4 relative overflow-hidden">
          {/* Background Pulse Effect - Synced with Ring */}
          <motion.div 
            className="absolute inset-0 bg-indigo-500/10 z-0 rounded-full origin-center"
            variants={pulseVariants}
            initial="initial"
            animate="animate"
          />

          <div className="relative z-10">
            <Avatar className="w-20 h-20 border-4 border-white dark:border-slate-700 shadow-lg">
              <AvatarImage src={incomingCall.caller?.avatar} />
              <AvatarFallback className="bg-indigo-600 text-white text-2xl">
                {incomingCall.caller?.name?.[0] || <PhoneIncoming />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-slate-800 animate-pulse shadow-sm" />
          </div>
          
          <div className="text-center z-10 relative">
             <div className="absolute right-[-80px] top-[-10px]">
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600" onClick={() => audioRingingService.toggleMute(true)}>
                        <BellOff className="w-3 h-3" />
                      </Button>
                   </TooltipTrigger>
                   <TooltipContent>Mute Ring</TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-xl">{incomingCall.caller?.name || 'Unknown Caller'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5 mt-1 font-medium">
              {incomingCall.type === 'video' ? <Video className="w-4 h-4 text-indigo-500" /> : <Phone className="w-4 h-4 text-indigo-500" />}
              Incoming {incomingCall.type} call...
            </p>
          </div>

          <div className="flex gap-4 w-full mt-4 z-10">
            <Button 
              variant="outline" 
              className="flex-1 rounded-full h-12 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-900/20 dark:text-red-400 transition-all"
              onClick={declineIncomingCall}
            >
              <X className="w-5 h-5 mr-2" /> Decline
            </Button>
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full h-12 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
              onClick={acceptIncomingCall}
            >
              {incomingCall.type === 'video' ? <Video className="w-5 h-5 mr-2" /> : <Phone className="w-5 h-5 mr-2" />}
              Accept
            </Button>
          </div>
        </div>
        
        {/* Progress Bar for Auto-dismiss */}
        <div className="h-1 bg-gray-100 dark:bg-gray-700 w-full">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 30, ease: "linear" }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallNotificationModal;