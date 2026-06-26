import { useState } from 'react';

/**
 * Stub hook — video background processing disabled for deployment.
 * TensorFlow/BodyPix dependencies removed to meet resource constraints.
 * Returns the input stream unchanged.
 */
export const useVideoBackground = (inputStream) => {
  return {
    processedStream: inputStream,
    isProcessing: false,
    error: null,
  };
};

export default useVideoBackground;
