import { useState, useEffect, useRef, useCallback } from 'react';
import { useBackgroundManager } from './useBackgroundManager';
import { BACKGROUND_EFFECTS } from './useVirtualBackground';

/**
 * Bridge hook that connects useBackgroundManager (UI selection)
 * with actual video stream processing via canvas + BodyPix.
 * 
 * Usage: const { processedStream, isProcessing } = useVideoBackground(rawCameraStream);
 * Then use processedStream as the srcObject for the <video> element.
 */
export const useVideoBackground = (inputStream) => {
  const { activeBackground } = useBackgroundManager();
  const [processedStream, setProcessedStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const bgImageRef = useRef(null);
  const modelRef = useRef(null);
  const activeRef = useRef(activeBackground);

  activeRef.current = activeBackground;

  // Load BodyPix model lazily
  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;
    try {
      const tf = await import('@tensorflow/tfjs');
      await tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
      await tf.ready();
      const bodyPix = await import('@tensorflow-models/body-pix');
      const model = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.5,
        quantBytes: 2
      });
      modelRef.current = model;
      return model;
    } catch (err) {
      console.error('Failed to load BodyPix model:', err);
      return null;
    }
  }, []);

  // Load a background image
  const loadBgImage = useCallback((url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { bgImageRef.current = img; resolve(img); };
      img.onerror = () => { bgImageRef.current = null; resolve(null); };
      img.src = url;
    });
  }, []);

  // Process frames
  const processFrames = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrames);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth || 640;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight || 480;

    const bg = activeRef.current;

    if (!bg || bg.id === 'none' || bg.type === 'none') {
      // No background — just draw raw video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      animFrameRef.current = requestAnimationFrame(processFrames);
      return;
    }

    // Need model for segmentation
    if (!modelRef.current) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      animFrameRef.current = requestAnimationFrame(processFrames);
      return;
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const seg = await modelRef.current.segmentPerson(video, {
        flipHorizontal: false,
        internalResolution: 'low',
        segmentationThreshold: 0.65
      });

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (bg.type === 'blur') {
        // Blur background
        const blurAmt = bg.intensity === 'heavy' ? 20 : 8;
        const tmp = document.createElement('canvas');
        tmp.width = canvas.width; tmp.height = canvas.height;
        const tmpCtx = tmp.getContext('2d');
        tmpCtx.filter = `blur(${blurAmt}px)`;
        tmpCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blurred = tmpCtx.getImageData(0, 0, canvas.width, canvas.height);
        const out = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < seg.data.length; i++) {
          const p = i * 4;
          if (seg.data[i]) { out.data[p]=imageData.data[p]; out.data[p+1]=imageData.data[p+1]; out.data[p+2]=imageData.data[p+2]; out.data[p+3]=255; }
          else { out.data[p]=blurred.data[p]; out.data[p+1]=blurred.data[p+1]; out.data[p+2]=blurred.data[p+2]; out.data[p+3]=255; }
        }
        ctx.putImageData(out, 0, 0);
      } else if (bg.type === 'image' && bgImageRef.current) {
        // Virtual background image
        ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
        const bgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const out = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < seg.data.length; i++) {
          const p = i * 4;
          if (seg.data[i]) { out.data[p]=imageData.data[p]; out.data[p+1]=imageData.data[p+1]; out.data[p+2]=imageData.data[p+2]; out.data[p+3]=255; }
          else { out.data[p]=bgData.data[p]; out.data[p+1]=bgData.data[p+1]; out.data[p+2]=bgData.data[p+2]; out.data[p+3]=255; }
        }
        ctx.putImageData(out, 0, 0);
      } else if (bg.type === 'solid') {
        // Solid color or gradient
        ctx.fillStyle = bg.color || '#374151';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const bgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const out = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < seg.data.length; i++) {
          const p = i * 4;
          if (seg.data[i]) { out.data[p]=imageData.data[p]; out.data[p+1]=imageData.data[p+1]; out.data[p+2]=imageData.data[p+2]; out.data[p+3]=255; }
          else { out.data[p]=bgData.data[p]; out.data[p+1]=bgData.data[p+1]; out.data[p+2]=bgData.data[p+2]; out.data[p+3]=255; }
        }
        ctx.putImageData(out, 0, 0);
      } else {
        // Fallback — just draw raw
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    } catch (err) {
      // On error, just draw raw video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    animFrameRef.current = requestAnimationFrame(processFrames);
  }, []);

  // Start/stop processing when background or stream changes
  useEffect(() => {
    if (!inputStream) {
      setProcessedStream(null);
      return;
    }

    const bgId = activeBackground?.id;
    if (!bgId || bgId === 'none') {
      // No background — return raw stream
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setProcessedStream(inputStream);
      setIsProcessing(false);
      return;
    }

    // Start processing
    let cancelled = false;
    const start = async () => {
      setIsProcessing(true);

      // Create hidden video element
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
      }
      videoRef.current.srcObject = inputStream;
      await videoRef.current.play().catch(() => {});

      // Create canvas
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;

      // Load model
      await loadModel();

      // Load background image if needed
      const bg = activeBackground;
      if (bg.type === 'image' && bg.src) {
        await loadBgImage(bg.src);
      } else if (bg.type === 'custom' && bg.src) {
        await loadBgImage(bg.src);
      }

      if (cancelled) return;

      // Start frame loop
      processFrames();

      // Create output stream from canvas
      const outStream = canvasRef.current.captureStream(24);
      // Carry audio from original stream
      inputStream.getAudioTracks().forEach(t => outStream.addTrack(t));
      setProcessedStream(outStream);
    };

    start();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inputStream, activeBackground, loadModel, loadBgImage, processFrames]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      modelRef.current = null;
    };
  }, []);

  return {
    processedStream: processedStream || inputStream,
    isProcessing
  };
};

export default useVideoBackground;
