
import { useState, useEffect } from 'react';
import { audioRingingService } from '@/services/audioRingingService';

export const useCallRingtone = () => {
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('echonote_ring_volume');
    return saved ? parseFloat(saved) : 0.7;
  });
  
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('echonote_ring_muted') === 'true';
  });

  const [ringtoneType, setRingtoneType] = useState(() => {
    return localStorage.getItem('echonote_ring_type') || 'grigri';
  });

  // Initialize service settings
  useEffect(() => {
    audioRingingService.setVolume(volume);
    audioRingingService.toggleMute(isMuted);
  }, []);

  const updateVolume = (newVolume) => {
    const val = parseFloat(newVolume);
    setVolume(val);
    audioRingingService.setVolume(val);
    localStorage.setItem('echonote_ring_volume', val);
  };

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    audioRingingService.toggleMute(newVal);
    localStorage.setItem('echonote_ring_muted', newVal);
  };

  const updateRingtoneType = (type) => {
    setRingtoneType(type);
    localStorage.setItem('echonote_ring_type', type);
  };

  const playPreview = () => {
    audioRingingService.startIncomingRing(ringtoneType);
    // Auto stop preview after 5s
    setTimeout(() => {
      if (audioRingingService.currentType === ringtoneType) { // Only stop if still playing preview
        audioRingingService.stopRingingSound();
      }
    }, 5000);
  };

  const stopPreview = () => {
    audioRingingService.stopRingingSound();
  };

  return {
    volume,
    isMuted,
    ringtoneType,
    updateVolume,
    toggleMute,
    updateRingtoneType,
    playPreview,
    stopPreview
  };
};
