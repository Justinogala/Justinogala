
import React, { useEffect, useState } from 'react';
import { Disc } from 'lucide-react';
import { useAdvancedVideoCall } from '@/context/AdvancedVideoCallContext';
import { motion } from 'framer-motion';

const RecordingManager = () => {
  const { isRecording, recordingStartTime } = useAdvancedVideoCall();
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    let interval;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - recordingStartTime) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
      <motion.div 
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2.5 h-2.5 bg-red-500 rounded-full"
      />
      <span className="text-xs font-mono font-medium text-red-400 tracking-wider">REC {duration}</span>
    </div>
  );
};

export default RecordingManager;
