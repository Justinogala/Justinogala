import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Dedicated hook for camera management.
 * Simplifies camera control by centralizing all camera logic.
 */
export const useCamera = ({
  initialVideoEnabled = true,
  initialAudioEnabled = true,
  onStreamChange,
  onError
}) => {
  const [stream, setStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);
  
  const streamRef = useRef(null);

  // Start camera and microphone
  const startCamera = useCallback(async (video = true, audio = true) => {
    console.log('[useCamera] startCamera called, video:', video, 'audio:', audio);
    setError(null);
    
    try {
      const constraints = {
        video: video ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: audio
      };
      
      console.log('[useCamera] Requesting media with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('[useCamera] Got stream:', mediaStream.id, {
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length,
        active: mediaStream.active
      });
      
      // Store the stream
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsVideoEnabled(video && mediaStream.getVideoTracks().length > 0);
      setIsAudioEnabled(audio && mediaStream.getAudioTracks().length > 0);
      setIsCameraReady(true);
      
      if (onStreamChange) {
        onStreamChange(mediaStream);
      }
      
      return mediaStream;
    } catch (err) {
      console.error('[useCamera] Error starting camera:', err);
      let errorMessage = 'Could not access camera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another app.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.';
      }
      
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      
      return null;
    }
  }, [onStreamChange, onError]);

  // Stop all tracks and cleanup
  const stopCamera = useCallback(() => {
    console.log('[useCamera] stopCamera called');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[useCamera] Stopped track:', track.kind, track.id);
      });
      streamRef.current = null;
    }
    setStream(null);
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    setIsCameraReady(false);
    
    if (onStreamChange) {
      onStreamChange(null);
    }
  }, [onStreamChange]);

  // Toggle video on/off
  const toggleVideo = useCallback(async () => {
    const currentStream = streamRef.current;
    console.log('[useCamera] toggleVideo called, current stream:', currentStream?.id, 'isVideoEnabled:', isVideoEnabled);
    
    if (isVideoEnabled && currentStream) {
      // Turn OFF video - just disable the track
      const videoTracks = currentStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = false;
        console.log('[useCamera] Disabled video track:', track.id);
      });
      setIsVideoEnabled(false);
      return currentStream;
    } else {
      // Turn ON video
      if (currentStream) {
        const videoTracks = currentStream.getVideoTracks();
        
        if (videoTracks.length > 0) {
          // Re-enable existing track
          videoTracks.forEach(track => {
            track.enabled = true;
            console.log('[useCamera] Re-enabled video track:', track.id);
          });
          setIsVideoEnabled(true);
          return currentStream;
        } else {
          // Need to get a new video track
          console.log('[useCamera] No video tracks, requesting new camera...');
          try {
            const newVideoStream = await navigator.mediaDevices.getUserMedia({
              video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
              }
            });
            
            const newVideoTrack = newVideoStream.getVideoTracks()[0];
            console.log('[useCamera] Got new video track:', newVideoTrack.id);
            
            // Create a new combined stream
            const audioTracks = currentStream.getAudioTracks();
            const newStream = new MediaStream([...audioTracks, newVideoTrack]);
            
            // Update refs and state
            streamRef.current = newStream;
            setStream(newStream);
            setIsVideoEnabled(true);
            
            if (onStreamChange) {
              onStreamChange(newStream);
            }
            
            return newStream;
          } catch (err) {
            console.error('[useCamera] Failed to get new video track:', err);
            setError('Could not access camera');
            if (onError) onError('Could not access camera');
            return null;
          }
        }
      } else {
        // No stream at all, start fresh
        console.log('[useCamera] No stream, starting fresh...');
        return await startCamera(true, isAudioEnabled);
      }
    }
  }, [isVideoEnabled, isAudioEnabled, startCamera, onStreamChange, onError]);

  // Toggle audio on/off
  const toggleAudio = useCallback(async () => {
    const currentStream = streamRef.current;
    console.log('[useCamera] toggleAudio called, current stream:', currentStream?.id, 'isAudioEnabled:', isAudioEnabled);
    
    if (isAudioEnabled && currentStream) {
      // Turn OFF audio
      const audioTracks = currentStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = false;
        console.log('[useCamera] Disabled audio track:', track.id);
      });
      setIsAudioEnabled(false);
      return currentStream;
    } else {
      // Turn ON audio
      if (currentStream) {
        const audioTracks = currentStream.getAudioTracks();
        
        if (audioTracks.length > 0) {
          audioTracks.forEach(track => {
            track.enabled = true;
            console.log('[useCamera] Re-enabled audio track:', track.id);
          });
          setIsAudioEnabled(true);
          return currentStream;
        } else {
          // Need to get a new audio track
          console.log('[useCamera] No audio tracks, requesting microphone...');
          try {
            const newAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const newAudioTrack = newAudioStream.getAudioTracks()[0];
            
            // Create new combined stream
            const videoTracks = currentStream.getVideoTracks();
            const newStream = new MediaStream([...videoTracks, newAudioTrack]);
            
            streamRef.current = newStream;
            setStream(newStream);
            setIsAudioEnabled(true);
            
            if (onStreamChange) {
              onStreamChange(newStream);
            }
            
            return newStream;
          } catch (err) {
            console.error('[useCamera] Failed to get audio:', err);
            return null;
          }
        }
      } else {
        // No stream at all, start fresh
        return await startCamera(isVideoEnabled, true);
      }
    }
  }, [isAudioEnabled, isVideoEnabled, startCamera, onStreamChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    isCameraReady,
    error,
    startCamera,
    stopCamera,
    toggleVideo,
    toggleAudio,
    setStream,
    setIsVideoEnabled,
    setIsAudioEnabled
  };
};

export default useCamera;
