import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Monitor, Camera, Mic, Square, Download, Trash2, Play, Pause, RotateCcw, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_RECORDING_TIME = 5 * 60; // 5 minutes in seconds

const QuickRecordPage = () => {
  const { toast } = useToast();
  
  // Recording state
  const [recordingType, setRecordingType] = useState(null); // 'screen' or 'camera'
  const [includeMicrophone, setIncludeMicrophone] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const livePreviewRef = useRef(null);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [cleanup, previewUrl]);

  // Start recording
  const startRecording = async () => {
    if (!recordingType) {
      toast({
        variant: "destructive",
        title: "Select recording type",
        description: "Please choose Screen or Camera before starting."
      });
      return;
    }

    try {
      cleanup();
      chunksRef.current = [];
      
      let stream;
      
      if (recordingType === 'screen') {
        // Get screen stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor'
          },
          audio: false
        });
        
        // If microphone is enabled, get audio stream and combine
        if (includeMicrophone) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true
              }
            });
            
            // Combine streams
            const combinedStream = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...audioStream.getAudioTracks()
            ]);
            stream = combinedStream;
            
            // Stop audio when screen share stops
            screenStream.getVideoTracks()[0].onended = () => {
              audioStream.getTracks().forEach(track => track.stop());
              stopRecording();
            };
          } catch (audioErr) {
            console.warn('Could not get microphone:', audioErr);
            stream = screenStream;
            toast({
              variant: "warning",
              title: "Microphone unavailable",
              description: "Recording without audio."
            });
          }
        } else {
          stream = screenStream;
        }
        
        // Handle user stopping screen share
        screenStream.getVideoTracks()[0].onended = () => {
          stopRecording();
        };
        
      } else if (recordingType === 'camera') {
        // Get camera stream with optional audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: includeMicrophone ? {
            echoCancellation: true,
            noiseSuppression: true
          } : false
        });
      }
      
      streamRef.current = stream;
      
      // Show live preview
      if (livePreviewRef.current) {
        livePreviewRef.current.srcObject = stream;
        livePreviewRef.current.play();
      }
      
      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setRecordedBlob(null);
      setPreviewUrl(null);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      toast({
        title: "Recording started",
        description: `Recording your ${recordingType}...`
      });
      
    } catch (err) {
      console.error('Recording error:', err);
      cleanup();
      
      let message = "Could not start recording.";
      if (err.name === 'NotAllowedError') {
        message = "Permission denied. Please allow access to record.";
      } else if (err.name === 'NotFoundError') {
        message = recordingType === 'camera' 
          ? "No camera found." 
          : "Screen sharing not supported.";
      }
      
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: message
      });
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    // Clear live preview
    if (livePreviewRef.current) {
      livePreviewRef.current.srcObject = null;
    }
  }, []);

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPaused(true);
    }
  };

  // Download recording
  const downloadRecording = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `munal-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your recording is being downloaded."
    });
  };

  // Discard recording
  const discardRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
    setRecordingType(null);
    
    toast({
      title: "Recording discarded",
      description: "You can start a new recording."
    });
  };

  // Record again
  const recordAgain = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingTime(0);
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <Helmet>
        <title>Quick Record | Munal</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quick Record</h1>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Recording for <span className="font-semibold text-gray-900 dark:text-white">Product Feedback</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        <motion.div 
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Recording Preview Area */}
          <AnimatePresence mode="wait">
            {(isRecording || previewUrl) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-900 relative"
              >
                {isRecording && (
                  <video
                    ref={livePreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video object-contain"
                  />
                )}
                {previewUrl && !isRecording && (
                  <video
                    ref={videoPreviewRef}
                    src={previewUrl}
                    controls
                    className="w-full aspect-video object-contain"
                  />
                )}
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                    )} />
                    <span className="text-white text-sm font-medium">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-8">
            {/* Title */}
            {!isRecording && !previewUrl && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Record Your Video
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose how you'd like to record
                  </p>
                </div>

                {/* Recording Type Selection */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => setRecordingType('screen')}
                    data-testid="record-screen-btn"
                    className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all duration-200",
                      recordingType === 'screen'
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    <Monitor className={cn(
                      "w-10 h-10 mb-4",
                      recordingType === 'screen' ? "text-rose-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "font-semibold mb-1",
                      recordingType === 'screen' ? "text-rose-600" : "text-gray-700 dark:text-gray-300"
                    )}>
                      Screen
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Share your screen
                    </span>
                  </button>

                  <button
                    onClick={() => setRecordingType('camera')}
                    data-testid="record-camera-btn"
                    className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all duration-200",
                      recordingType === 'camera'
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    <Camera className={cn(
                      "w-10 h-10 mb-4",
                      recordingType === 'camera' ? "text-rose-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "font-semibold mb-1",
                      recordingType === 'camera' ? "text-rose-600" : "text-gray-700 dark:text-gray-300"
                    )}>
                      Camera
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Use your webcam
                    </span>
                  </button>
                </div>

                {/* Microphone Option */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="microphone"
                      checked={includeMicrophone}
                      onCheckedChange={setIncludeMicrophone}
                      className="mt-0.5 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                      data-testid="include-microphone-checkbox"
                    />
                    <div>
                      <label 
                        htmlFor="microphone" 
                        className="font-medium text-gray-900 dark:text-white cursor-pointer flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        Include microphone audio
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Recommended: Keep enabled to explain the issue verbally while recording your screen.
                        Your voice helps us understand the problem better.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Recording Controls */}
            {isRecording && (
              <div className="flex items-center justify-center gap-4 py-4">
                <Button
                  onClick={togglePause}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  data-testid="pause-resume-btn"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="gap-2 bg-rose-500 hover:bg-rose-600"
                  data-testid="stop-recording-btn"
                >
                  <Square className="w-4 h-4" />
                  Stop Recording
                </Button>
              </div>
            )}

            {/* Post-Recording Actions */}
            {previewUrl && !isRecording && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={downloadRecording}
                    className="gap-2 bg-rose-500 hover:bg-rose-600"
                    size="lg"
                    data-testid="download-recording-btn"
                  >
                    <Download className="w-4 h-4" />
                    Download Recording
                  </Button>
                  
                  <Button
                    onClick={recordAgain}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    data-testid="record-again-btn"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Record Again
                  </Button>
                  
                  <Button
                    onClick={discardRecording}
                    variant="ghost"
                    size="lg"
                    className="gap-2 text-gray-500 hover:text-red-500"
                    data-testid="discard-recording-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                    Discard
                  </Button>
                </div>
                
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Recording duration: {formatTime(recordingTime)}
                </p>
              </div>
            )}

            {/* Start Recording Button */}
            {!isRecording && !previewUrl && (
              <>
                <Button
                  onClick={startRecording}
                  disabled={!recordingType}
                  className={cn(
                    "w-full h-12 text-base font-medium gap-2 transition-all",
                    recordingType
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/25"
                      : "bg-rose-300 cursor-not-allowed"
                  )}
                  data-testid="start-recording-btn"
                >
                  <div className="w-3 h-3 rounded-full bg-white/80" />
                  Start Recording
                </Button>

                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
                  Maximum recording time: 5 minutes
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickRecordPage;
