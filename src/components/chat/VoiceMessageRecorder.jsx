import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const VoiceMessageRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopTimer();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Please allow microphone access to record voice messages.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    onCancel && onCancel();
  };

  const handleSend = () => {
    if (audioBlob) {
      // Create a File object from the blob
      const file = new File([audioBlob], "voice-message.webm", { type: "audio/webm" });
      onSend(file, recordingTime);
      cancelRecording(); // Reset state
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioPlayerRef.current = new Audio(url);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
      audioPlayerRef.current.ontimeupdate = () => setPlaybackTime(Math.floor(audioPlayerRef.current.currentTime));
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 1. Initial State: Button to start
  if (!isRecording && !audioBlob) {
    return (
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        onClick={startRecording}
        className="text-gray-500 hover:text-red-500 rounded-full transition-colors"
      >
        <Mic className="w-5 h-5" />
      </Button>
    );
  }

  // 2. Recording State
  if (isRecording) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30"
      >
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-mono text-red-600 dark:text-red-400 w-12">{formatTime(recordingTime)}</span>
        
        <div className="h-4 w-24 flex items-center gap-0.5 justify-center overflow-hidden">
          {/* Fake waveform animation */}
          {[...Array(12)].map((_, i) => (
             <motion.div
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-red-400/50 rounded-full"
             />
          ))}
        </div>

        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-full"
          onClick={stopRecording}
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </motion.div>
    );
  }

  // 3. Review State
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-2 py-1.5 rounded-full border border-gray-200 dark:border-slate-700"
    >
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-gray-500 hover:text-red-500 rounded-full"
        onClick={cancelRecording}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <Button 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-full"
        onClick={togglePlayback}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </Button>

      <div className="flex flex-col w-20">
        <span className="text-[10px] font-mono text-gray-500">
          {formatTime(playbackTime)} / {formatTime(recordingTime)}
        </span>
        <div className="h-1 bg-gray-300 dark:bg-slate-600 rounded-full mt-0.5 overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-500" 
            style={{ width: `${(playbackTime / recordingTime) * 100}%` }}
          />
        </div>
      </div>

      <Button 
        size="icon" 
        className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full ml-1"
        onClick={handleSend}
      >
        <Send className="w-3 h-3 ml-0.5" />
      </Button>
    </motion.div>
  );
};

export default VoiceMessageRecorder;