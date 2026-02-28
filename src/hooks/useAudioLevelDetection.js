import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for detecting audio levels from media streams
 * Uses Web Audio API's AnalyserNode to analyze audio frequency data
 */
export const useAudioLevelDetection = ({
  localStream,
  remoteStreams,
  localUserId,
  onActiveSpeakerChange,
  threshold = 0.02, // Minimum audio level to be considered "speaking"
  speakingDebounce = 300, // ms to wait before switching speaker
}) => {
  const [audioLevels, setAudioLevels] = useState(new Map()); // userId -> audioLevel
  const [isSpeaking, setIsSpeaking] = useState(new Map()); // userId -> boolean
  
  const audioContextRef = useRef(null);
  const analyzersRef = useRef(new Map()); // userId -> { analyser, source }
  const animationFrameRef = useRef(null);
  const lastSpeakerRef = useRef(null);
  const speakerTimeoutRef = useRef(null);
  
  // Initialize AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);
  
  // Create analyser for a stream
  const createAnalyser = useCallback((stream, userId) => {
    if (!stream || analyzersRef.current.has(userId)) return;
    
    try {
      const audioContext = getAudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyzersRef.current.set(userId, { analyser, source, stream });
      console.log(`Audio analyser created for user ${userId}`);
    } catch (err) {
      console.error(`Error creating audio analyser for ${userId}:`, err);
    }
  }, [getAudioContext]);
  
  // Remove analyser for a user
  const removeAnalyser = useCallback((userId) => {
    const analyserData = analyzersRef.current.get(userId);
    if (analyserData) {
      try {
        analyserData.source.disconnect();
      } catch (err) {
        // Ignore disconnect errors
      }
      analyzersRef.current.delete(userId);
    }
  }, []);
  
  // Calculate RMS audio level from frequency data
  const calculateAudioLevel = useCallback((analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for better accuracy
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length) / 255;
    
    return rms;
  }, []);
  
  // Main analysis loop using ref to avoid recursive callback issue
  const analyzeAudioRef = useRef(null);
  
  useEffect(() => {
    analyzeAudioRef.current = () => {
      const newLevels = new Map();
      const newSpeaking = new Map();
      let maxLevel = 0;
      let maxLevelUserId = null;
      
      analyzersRef.current.forEach((data, odId) => {
        const level = calculateAudioLevel(data.analyser);
        newLevels.set(odId, level);
        
        const speaking = level > threshold;
        newSpeaking.set(odId, speaking);
        
        if (speaking && level > maxLevel) {
          maxLevel = level;
          maxLevelUserId = odId;
        }
      });
      
      setAudioLevels(newLevels);
      setIsSpeaking(newSpeaking);
      
      // Update active speaker with debounce
      if (maxLevelUserId && maxLevelUserId !== lastSpeakerRef.current) {
        if (speakerTimeoutRef.current) {
          clearTimeout(speakerTimeoutRef.current);
        }
        
        speakerTimeoutRef.current = setTimeout(() => {
          lastSpeakerRef.current = maxLevelUserId;
          if (onActiveSpeakerChange) {
            onActiveSpeakerChange(maxLevelUserId);
          }
        }, speakingDebounce);
      }
      
      animationFrameRef.current = requestAnimationFrame(analyzeAudioRef.current);
    };
  }, [calculateAudioLevel, threshold, speakingDebounce, onActiveSpeakerChange]);
  
  // Setup analyser for local stream
  useEffect(() => {
    if (localStream && localUserId) {
      createAnalyser(localStream, localUserId);
    }
    
    return () => {
      if (localUserId) {
        removeAnalyser(localUserId);
      }
    };
  }, [localStream, localUserId, createAnalyser, removeAnalyser]);
  
  // Setup analysers for remote streams
  useEffect(() => {
    if (remoteStreams && remoteStreams instanceof Map) {
      // Add new analysers
      remoteStreams.forEach((stream, odId) => {
        if (!analyzersRef.current.has(odId)) {
          createAnalyser(stream, odId);
        }
      });
      
      // Remove old analysers
      analyzersRef.current.forEach((_, odId) => {
        if (odId !== localUserId && !remoteStreams.has(odId)) {
          removeAnalyser(odId);
        }
      });
    }
  }, [remoteStreams, localUserId, createAnalyser, removeAnalyser]);
  
  // Start/stop analysis loop
  useEffect(() => {
    if (analyzersRef.current.size > 0) {
      analyzeAudio();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (speakerTimeoutRef.current) {
        clearTimeout(speakerTimeoutRef.current);
      }
    };
  }, [analyzeAudio]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      analyzersRef.current.forEach((_, odId) => {
        removeAnalyser(odId);
      });
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [removeAnalyser]);
  
  // Get audio level for a specific user
  const getAudioLevel = useCallback((odId) => {
    return audioLevels.get(odId) || 0;
  }, [audioLevels]);
  
  // Check if a user is currently speaking
  const isUserSpeaking = useCallback((odId) => {
    return isSpeaking.get(odId) || false;
  }, [isSpeaking]);
  
  return {
    audioLevels,
    isSpeaking,
    getAudioLevel,
    isUserSpeaking,
    createAnalyser,
    removeAnalyser
  };
};

export default useAudioLevelDetection;
