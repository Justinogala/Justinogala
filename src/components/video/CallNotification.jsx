import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const CallNotification = ({ incomingCall, onAccept, onReject }) => {
  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 right-4 z-[100] w-full max-w-sm"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-violet-100 dark:border-slate-800 overflow-hidden relative">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-800 shadow-md">
                  <AvatarImage src={incomingCall.caller.avatar} />
                  <AvatarFallback className={cn("text-white font-bold", incomingCall.caller.color)}>
                    {incomingCall.caller.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-1 rounded-full">
                  <div className="bg-violet-600 rounded-full p-1">
                    {incomingCall.type === 'video' ? (
                      <Video className="w-3 h-3 text-white" />
                    ) : (
                      <Phone className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                  {incomingCall.caller.name}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Incoming {incomingCall.type} call...
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button 
                variant="outline" 
                onClick={onReject}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-2" /> Decline
              </Button>
              <Button 
                onClick={onAccept}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4 mr-2" /> Accept
              </Button>
            </div>
          </div>
          
          {/* Progress Bar for Timeout */}
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
            <motion.div 
              className="h-full bg-violet-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 15, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallNotification;