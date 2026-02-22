import { useState, useCallback } from 'react';

export const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // KB/s
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [error, setError] = useState(null);

  const allowedTypes = {
    audio: ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/ogg', 'audio/mp3'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/avi'],
    document: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  };

  const validateFile = (selectedFile) => {
    const allAllowed = [...allowedTypes.audio, ...allowedTypes.video, ...allowedTypes.document];
    // Simple extension check fallback if type is empty/generic
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    const typeValid = allAllowed.includes(selectedFile.type) || 
                      ['mp3', 'wav', 'm4a', 'ogg', 'mp4', 'mov', 'avi', 'mkv', 'pdf', 'docx', 'txt'].includes(extension);

    if (!typeValid) {
      setError('Invalid file type. Please upload audio, video, or document files.');
      return false;
    }

    if (selectedFile.size > 500 * 1024 * 1024) { // 500MB limit
      setError('File size exceeds 500MB limit.');
      return false;
    }

    setError(null);
    return true;
  };

  const selectFile = useCallback((selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setStatus('idle');
      setProgress(0);
    }
  }, []);

  const simulateUpload = useCallback(async (onComplete) => {
    if (!file) return;

    setStatus('uploading');
    setProgress(0);
    
    // Simulate upload
    const totalSize = file.size;
    let uploaded = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const chunkSize = Math.random() * 1024 * 1024 * 2; // Random chunk 0-2MB
      uploaded = Math.min(uploaded + chunkSize, totalSize);
      
      const currentProgress = (uploaded / totalSize) * 100;
      const elapsedTime = (Date.now() - startTime) / 1000; // seconds
      const speed = elapsedTime > 0 ? (uploaded / 1024) / elapsedTime : 0; // KB/s
      
      setProgress(currentProgress);
      setUploadSpeed(speed);

      if (uploaded >= totalSize) {
        clearInterval(interval);
        setStatus('success');
        if (onComplete) onComplete(file);
      }
    }, 200);
    
    return () => clearInterval(interval);
  }, [file]);

  const reset = () => {
    setFile(null);
    setProgress(0);
    setUploadSpeed(0);
    setStatus('idle');
    setError(null);
  };

  return {
    file,
    progress,
    uploadSpeed,
    status,
    error,
    selectFile,
    simulateUpload,
    reset
  };
};