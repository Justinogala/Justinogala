
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, MicOff, Video, VideoOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { webrtcService } from '@/services/webrtcService';

const CameraPreviewModal = ({ isOpen, onClose, onStartCall }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('pending'); // pending, granted, denied
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  useEffect(() => {
    let currentStream = null;
    
    const startCamera = async () => {
      if (!isOpen) return;
      
      try {
        setPermissionStatus('pending');
        // Get stream just for preview
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(currentStream);
        setPermissionStatus('granted');
        
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Camera permission failed", err);
        setPermissionStatus('denied');
      }
    };

    if (isOpen) {
      startCamera();
    } else {
        // Cleanup if closed
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const handleStart = () => {
    // Clean up preview stream before actual call starts to avoid conflict
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    onStartCall();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Ready to join?</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative mb-6">
              {permissionStatus === 'pending' && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-white">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p>Accessing camera...</p>
                </div>
              )}
              
              {permissionStatus === 'denied' && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-white bg-gray-900">
                  <Camera className="w-12 h-12 text-red-500 mb-2" />
                  <p className="font-medium">Camera access denied</p>
                  <p className="text-sm text-gray-400 text-center px-4">Please allow camera access in your browser settings to continue.</p>
                </div>
              )}

              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover transform scale-x-[-1] ${!isVideoOn ? 'hidden' : ''}`}
              />
              
              {!isVideoOn && permissionStatus === 'granted' && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                        <span className="text-2xl text-white font-bold">You</span>
                    </div>
                </div>
              )}

              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <Button 
                    size="icon"
                    variant={isMicOn ? "secondary" : "destructive"}
                    className="rounded-full w-12 h-12"
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button 
                    size="icon"
                    variant={isVideoOn ? "secondary" : "destructive"}
                    className="rounded-full w-12 h-12"
                    onClick={toggleVideo}
                >
                    {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
               <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
               <Button 
                 className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" 
                 disabled={permissionStatus !== 'granted'}
                 onClick={handleStart}
                >
                 Start Call
               </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CameraPreviewModal;
