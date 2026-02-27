import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const IncomingCallModal = ({ 
  caller, 
  callType = 'audio', 
  onAccept, 
  onReject 
}) => {
  const audioRef = useRef(null);

  // Play ringtone
  useEffect(() => {
    // Create ringtone using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = null;
    let gainNode = null;
    let isPlaying = true;

    const playRingtone = () => {
      if (!isPlaying) return;
      
      oscillator = audioContext.createOscillator();
      gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      
      // Ring pattern: on for 1s, off for 2s
      setTimeout(() => {
        if (oscillator) {
          oscillator.stop();
          oscillator = null;
        }
        setTimeout(() => {
          if (isPlaying) playRingtone();
        }, 2000);
      }, 1000);
    };

    playRingtone();

    return () => {
      isPlaying = false;
      if (oscillator) {
        oscillator.stop();
      }
      audioContext.close();
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/10"
        >
          {/* Caller Avatar */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full blur-xl opacity-50" />
              <Avatar className="h-28 w-28 ring-4 ring-white/20 relative">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-3xl font-bold">
                  {caller?.name?.charAt(0) || caller?.initials || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 border-4 border-emerald-500 rounded-full"
                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </motion.div>

            {/* Caller Info */}
            <h2 className="text-2xl font-bold text-white mt-6">{caller?.name || 'Unknown'}</h2>
            <div className="flex items-center gap-2 mt-2">
              {callType === 'video' ? (
                <Video className="w-4 h-4 text-emerald-400" />
              ) : (
                <Phone className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-emerald-400 font-medium">
                Incoming {callType} call
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {/* Reject Button */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                onClick={onReject}
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            </motion.div>

            {/* Accept Button */}
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.95 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                onClick={onAccept}
              >
                {callType === 'video' ? (
                  <Video className="w-7 h-7" />
                ) : (
                  <Phone className="w-7 h-7" />
                )}
              </Button>
            </motion.div>
          </div>

          {/* Labels */}
          <div className="flex items-center justify-center gap-16 mt-3">
            <span className="text-sm text-gray-400">Decline</span>
            <span className="text-sm text-gray-400">Accept</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncomingCallModal;
