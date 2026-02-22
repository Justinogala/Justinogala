
import { useState, useEffect, useCallback, useRef } from 'react';

const useVoiceSpeechRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(''); // Keep track of accumulated final transcript

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
          setError(null);
        };

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          let maxConfidence = 0;

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const transcriptText = result[0].transcript;
            
            if (result.isFinal) {
              final += transcriptText + ' ';
              // Update confidence from the final result
              if (result[0].confidence > maxConfidence) {
                maxConfidence = result[0].confidence;
              }
            } else {
              interim += transcriptText;
            }
          }

          if (final) {
            finalTranscriptRef.current += final;
            setTranscript(finalTranscriptRef.current);
            setConfidence(maxConfidence);
          }
          
          setInterimTranscript(interim);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setError(event.error);
          if (event.error === 'not-allowed') {
            setIsRecording(false);
          }
        };

        recognition.onend = () => {
          // If we were supposed to be recording but it stopped (e.g., silence), restart
          // Note: Logic to auto-restart can be complex; simplified here for user control
          if (isRecording) {
            // Optional: Auto restart if designed for always-on, 
            // but usually better to let user manually toggle for privacy in chat apps.
            // For this implementation, we'll sync state to stopped.
            setIsRecording(false); 
          }
        };

        recognitionRef.current = recognition;
      } else {
        setError('Web Speech API is not supported in this browser.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      try {
        // Reset only interim, keep final if continuing? 
        // Usually chat starts fresh or appends. We'll append.
        recognitionRef.current.start();
        setError(null);
      } catch (err) {
        console.error("Start failed:", err);
      }
    }
  }, [isRecording]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setConfidence(0);
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    clearTranscript
  };
};

export default useVoiceSpeechRecognition;
