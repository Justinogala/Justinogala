import { useState, useRef, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';

// Background effect types
export const BACKGROUND_EFFECTS = {
  NONE: 'none',
  BLUR_LIGHT: 'blur_light',
  BLUR_MEDIUM: 'blur_medium', 
  BLUR_HEAVY: 'blur_heavy',
  VIRTUAL: 'virtual'
};

// Preset virtual backgrounds - using Unsplash images
export const VIRTUAL_BACKGROUNDS = [
  { id: 'office', name: 'Modern Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80' },
  { id: 'nature', name: 'Nature', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=80' },
  { id: 'beach', name: 'Beach', url: 'https://images.unsplash.com/photo-1631535152690-ba1a85229136?w=1280&q=80' },
  { id: 'space', name: 'Space', url: 'https://images.unsplash.com/photo-1504812333783-63b845853c20?w=1280&q=80' },
  { id: 'gradient1', name: 'Purple Gradient', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient2', name: 'Blue Gradient', color: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'solid1', name: 'Dark Gray', color: '#1f2937' },
  { id: 'solid2', name: 'Navy', color: '#1e3a5f' }
];

/**
 * Custom hook for applying virtual backgrounds and blur effects
 * Uses TensorFlow.js BodyPix for person segmentation
 */
export const useVirtualBackground = ({
  inputStream,
  enabled = false,
  effect = BACKGROUND_EFFECTS.NONE,
  backgroundImage = null,
  backgroundColor = null,
  onProcessingStart,
  onProcessingEnd,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputStream, setOutputStream] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [fps, setFps] = useState(0);
  
  const modelRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef(null);
  
  // Initialize TensorFlow.js backend
  const initTensorFlow = useCallback(async () => {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('TensorFlow.js backend ready:', tf.getBackend());
      return true;
    } catch (err) {
      console.error('Error initializing TensorFlow:', err);
      // Fallback to CPU
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('TensorFlow.js fallback to CPU');
        return true;
      } catch (fallbackErr) {
        console.error('TensorFlow fallback failed:', fallbackErr);
        return false;
      }
    }
  }, []);
  
  // Load BodyPix model
  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;
    
    setIsLoading(true);
    try {
      const tfReady = await initTensorFlow();
      if (!tfReady) throw new Error('TensorFlow initialization failed');
      
      // Load BodyPix with optimized settings for real-time performance
      const model = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
      });
      
      modelRef.current = model;
      setModelReady(true);
      console.log('BodyPix model loaded successfully');
      return model;
    } catch (err) {
      console.error('Error loading BodyPix model:', err);
      if (onError) onError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [initTensorFlow, onError]);
  
  // Load background image
  const loadBackgroundImage = useCallback(async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        backgroundImageRef.current = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }, []);
  
  // Apply blur effect to background
  const applyBlurEffect = useCallback((ctx, canvas, segmentation, blurAmount) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Create a temporary canvas for the blurred version
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw blurred video
    tempCtx.filter = `blur(${blurAmount}px)`;
    tempCtx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    tempCtx.filter = 'none';
    
    const blurredData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    const outputData = ctx.createImageData(canvas.width, canvas.height);
    
    // Composite: person from original, background from blurred
    for (let i = 0; i < segmentation.data.length; i++) {
      const isPerson = segmentation.data[i];
      const pixelIndex = i * 4;
      
      if (isPerson) {
        // Keep original pixel (person)
        outputData.data[pixelIndex] = imageData.data[pixelIndex];
        outputData.data[pixelIndex + 1] = imageData.data[pixelIndex + 1];
        outputData.data[pixelIndex + 2] = imageData.data[pixelIndex + 2];
        outputData.data[pixelIndex + 3] = imageData.data[pixelIndex + 3];
      } else {
        // Use blurred pixel (background)
        outputData.data[pixelIndex] = blurredData.data[pixelIndex];
        outputData.data[pixelIndex + 1] = blurredData.data[pixelIndex + 1];
        outputData.data[pixelIndex + 2] = blurredData.data[pixelIndex + 2];
        outputData.data[pixelIndex + 3] = blurredData.data[pixelIndex + 3];
      }
    }
    
    ctx.putImageData(outputData, 0, 0);
  }, []);
  
  // Apply virtual background
  const applyVirtualBackground = useCallback((ctx, canvas, segmentation) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Draw background first
    if (backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
    } else if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    const bgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const outputData = ctx.createImageData(canvas.width, canvas.height);
    
    // Composite person onto background
    for (let i = 0; i < segmentation.data.length; i++) {
      const isPerson = segmentation.data[i];
      const pixelIndex = i * 4;
      
      if (isPerson) {
        // Person pixel from original video
        outputData.data[pixelIndex] = imageData.data[pixelIndex];
        outputData.data[pixelIndex + 1] = imageData.data[pixelIndex + 1];
        outputData.data[pixelIndex + 2] = imageData.data[pixelIndex + 2];
        outputData.data[pixelIndex + 3] = 255;
      } else {
        // Background pixel
        outputData.data[pixelIndex] = bgData.data[pixelIndex];
        outputData.data[pixelIndex + 1] = bgData.data[pixelIndex + 1];
        outputData.data[pixelIndex + 2] = bgData.data[pixelIndex + 2];
        outputData.data[pixelIndex + 3] = 255;
      }
    }
    
    ctx.putImageData(outputData, 0, 0);
  }, [backgroundColor]);
  
  // Process video frame
  const processFrame = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }
    
    // Ensure canvas matches video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }
    
    try {
      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (effect !== BACKGROUND_EFFECTS.NONE) {
        // Perform person segmentation
        const segmentation = await modelRef.current.segmentPerson(video, {
          flipHorizontal: false,
          internalResolution: 'medium',
          segmentationThreshold: 0.7
        });
        
        // Apply effect based on type
        switch (effect) {
          case BACKGROUND_EFFECTS.BLUR_LIGHT:
            applyBlurEffect(ctx, canvas, segmentation, 5);
            break;
          case BACKGROUND_EFFECTS.BLUR_MEDIUM:
            applyBlurEffect(ctx, canvas, segmentation, 10);
            break;
          case BACKGROUND_EFFECTS.BLUR_HEAVY:
            applyBlurEffect(ctx, canvas, segmentation, 20);
            break;
          case BACKGROUND_EFFECTS.VIRTUAL:
            applyVirtualBackground(ctx, canvas, segmentation);
            break;
          default:
            break;
        }
      }
      
      // Track FPS
      frameCountRef.current++;
      
    } catch (err) {
      console.error('Frame processing error:', err);
    }
    
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [effect, applyBlurEffect, applyVirtualBackground]);
  
  // Start processing
  const startProcessing = useCallback(async () => {
    if (!inputStream) return;
    
    // Create video element for input
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
    }
    
    // Create canvas for output
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    videoRef.current.srcObject = inputStream;
    await videoRef.current.play();
    
    // Set initial canvas size
    canvasRef.current.width = videoRef.current.videoWidth || 640;
    canvasRef.current.height = videoRef.current.videoHeight || 480;
    
    // Load model if needed
    if (!modelRef.current) {
      await loadModel();
    }
    
    // Load background image if specified
    if (backgroundImage) {
      try {
        await loadBackgroundImage(backgroundImage);
      } catch (err) {
        console.error('Failed to load background image:', err);
      }
    }
    
    setIsProcessing(true);
    if (onProcessingStart) onProcessingStart();
    
    // Start FPS counter
    frameCountRef.current = 0;
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);
    
    // Start processing loop
    processFrame();
    
    // Create output stream from canvas
    const stream = canvasRef.current.captureStream(30);
    
    // Add audio track from original stream
    const audioTracks = inputStream.getAudioTracks();
    audioTracks.forEach(track => stream.addTrack(track));
    
    setOutputStream(stream);
    
  }, [inputStream, backgroundImage, loadModel, loadBackgroundImage, processFrame, onProcessingStart]);
  
  // Stop processing
  const stopProcessing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }
    
    setIsProcessing(false);
    setOutputStream(null);
    setFps(0);
    
    if (onProcessingEnd) onProcessingEnd();
  }, [onProcessingEnd]);
  
  // Handle effect changes
  useEffect(() => {
    if (enabled && inputStream) {
      startProcessing();
    } else {
      stopProcessing();
    }
    
    return () => {
      stopProcessing();
    };
  }, [enabled, inputStream, effect, startProcessing, stopProcessing]);
  
  // Handle background image changes
  useEffect(() => {
    if (backgroundImage && effect === BACKGROUND_EFFECTS.VIRTUAL) {
      loadBackgroundImage(backgroundImage).catch(console.error);
    }
  }, [backgroundImage, effect, loadBackgroundImage]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProcessing();
      if (modelRef.current) {
        modelRef.current = null;
      }
    };
  }, [stopProcessing]);
  
  return {
    outputStream: isProcessing ? outputStream : inputStream,
    isLoading,
    isProcessing,
    modelReady,
    fps,
    startProcessing,
    stopProcessing,
    loadModel
  };
};

export default useVirtualBackground;
