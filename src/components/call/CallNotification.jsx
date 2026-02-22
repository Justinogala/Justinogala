
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { audioRingingService } from '@/services/audioRingingService';

const CallNotification = ({ incomingCall, onAccept, onReject }) => {
  useEffect(() => {
    if (incomingCall) {
      audioRingingService.startIncomingRing();
    }
    return () => {
      audioRingingService.stopRingingSound();
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-6 right-6 z-[70] w-full max-w-sm"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-violet-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-lg">
                  <AvatarImage src={incomingCall.caller?.avatar} />
                  <AvatarFallback className="bg-violet-600 text-white text-lg">
                    {incomingCall.caller?.initials || incomingCall.caller?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 ring-2 ring-white dark:ring-slate-900">
                  {incomingCall.type === 'video' ? (
                    <Video className="h-3 w-3 text-white" />
                  ) : (
                    <Phone className="h-3 w-3 text-white" />
                  )}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {incomingCall.caller?.name || 'Unknown Caller'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  Incoming {incomingCall.type} call...
                </p>
                <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                  ECHONOTE WORKSPACE
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={onReject}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-2" /> Decline
              </Button>
              <Button 
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
              >
                <Check className="w-4 h-4 mr-2" /> Accept
              </Button>
            </div>
          </div>
          
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
            <motion.div 
              className="h-full bg-violet-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 30, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallNotification;
