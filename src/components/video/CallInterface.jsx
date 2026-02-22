import React from 'react';
import { Phone, Video, MoreHorizontal, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const CallInterface = ({ selectedUser, onStartAudioCall, onStartVideoCall }) => {
  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No Contact Selected</h3>
        <p className="max-w-xs text-sm">Select a user from the sidebar to start a voice or video call.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-violet-100/50 to-transparent dark:from-violet-900/10 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={selectedUser.id}
          className="flex flex-col items-center"
        >
          <div className="relative mb-8">
            <Avatar className="h-40 w-40 border-4 border-white dark:border-slate-800 shadow-2xl">
              <AvatarImage src={selectedUser.avatar} />
              <AvatarFallback className={cn("text-4xl text-white", selectedUser.color)}>
                {selectedUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-white dark:border-slate-800",
              selectedUser.status === 'online' ? "bg-emerald-500" : "bg-slate-400"
            )} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedUser.name}</h1>
          <p className="text-slate-500 text-lg mb-8">{selectedUser.email}</p>

          <div className="flex items-center gap-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-slate-700 text-violet-600 shadow-lg border-2 border-transparent hover:border-violet-200 dark:hover:border-violet-800 flex flex-col gap-1"
                onClick={onStartAudioCall}
              >
                <Phone className="h-6 w-6" />
                <span className="text-[10px] font-medium">Audio</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                className="h-16 w-16 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/30 flex flex-col gap-1"
                onClick={onStartVideoCall}
              >
                <Video className="h-6 w-6" />
                <span className="text-[10px] font-medium">Video</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                variant="outline"
                className="h-16 w-16 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex flex-col gap-1"
              >
                <MoreHorizontal className="h-6 w-6" />
                <span className="text-[10px] font-medium">More</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      <div className="p-4 text-center text-xs text-slate-400">
        <p>Calls are end-to-end encrypted and secure.</p>
      </div>
    </div>
  );
};

export default CallInterface;