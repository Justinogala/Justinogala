
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/styles/voiceChat.css';

const VoiceChatInterface = ({ 
  isRecording, 
  transcript, 
  interimTranscript, 
  recordingTime, 
  confidence 
}) => {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Visualizer / Mic Status Area */}
      <div className="flex flex-col items-center justify-center py-8 relative">
        <div className="relative">
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full mic-active-ring -z-10"
              />
            )}
          </AnimatePresence>
          
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
            isRecording 
              ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30 recording-pulse" 
              : "bg-white dark:bg-slate-800 border-4 border-gray-100 dark:border-slate-700"
          )}>
            <Mic className={cn(
              "w-12 h-12 transition-colors duration-300",
              isRecording ? "text-white" : "text-gray-400 dark:text-slate-500"
            )} />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center space-y-2">
          <div className={cn(
            "text-4xl font-bold font-mono tracking-wider transition-colors duration-300",
            isRecording ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-slate-600"
          )}>
            {formatTime(recordingTime)}
          </div>
          
          <div className="h-6 flex items-center justify-center gap-2">
            {isRecording ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Recording in progress</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Ready to record</span>
            )}
          </div>

          {isRecording && confidence > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full mt-2">
              <Activity className="w-3 h-3" />
              <span>Confidence: {Math.round(confidence * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Display Area */}
      <div 
        className="glass-panel rounded-2xl p-6 min-h-[300px] max-h-[500px] flex flex-col shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
          <h3 className="font-semibold text-lg text-foreground">Live Transcript</h3>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            {isRecording ? 'Listening...' : 'History'}
          </span>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto transcript-area pr-2 space-y-2"
        >
          {transcript ? (
            <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
              {transcript}
              {interimTranscript && (
                <span className="text-muted-foreground italic ml-1">{interimTranscript}</span>
              )}
            </p>
          ) : interimTranscript ? (
             <p className="text-lg leading-relaxed text-muted-foreground italic">
               {interimTranscript}
             </p>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground/50">
              <p>Start recording to see transcription here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChatInterface;
