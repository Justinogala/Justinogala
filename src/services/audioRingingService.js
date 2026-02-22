
// Service to handle ringing sounds using Web Audio API
class AudioRingingService {
  constructor() {
    this.audioContext = null;
    this.oscillators = [];
    this.gainNode = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.timer = null;
    this.currentType = null;
    this.volume = 0.7; // Default volume
    this.isMuted = false;
  }

  _initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this._updateVolume();
    }
  }

  async resumeContext() {
    this._initAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn("AudioContext resume failed", e);
      }
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this._updateVolume();
  }

  toggleMute(muted) {
    this.isMuted = muted;
    this._updateVolume();
  }

  _updateVolume() {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioContext.currentTime);
    }
  }

  startIncomingRing(type = 'grigri') {
    if (this.isPlaying && this.currentType === type) return;
    this.stopRingingSound();
    
    this._initAudioContext();
    this.isPlaying = true;
    this.currentType = type;

    if (type === 'digital') {
      this._playDigitalTone();
    } else {
      this._playGriGriTone();
    }
  }

  startOutgoingRing() {
    if (this.isPlaying && this.currentType === 'outgoing') return;
    this.stopRingingSound();

    this._initAudioContext();
    this.isPlaying = true;
    this.currentType = 'outgoing';
    this._playOutgoingTone();
  }

  stopRingingSound() {
    this.isPlaying = false;
    this.currentType = null;

    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) { /* ignore */ }
    });
    this.oscillators = [];

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (e) { /* ignore */ }
      this.gainNode = null;
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // Classic "Gri Gri" Telephone Ring
  // 400Hz + 450Hz modulated by 25Hz to simulate mechanical striker
  _playGriGriTone() {
    if (!this.isPlaying) return;
    const now = this.audioContext.currentTime;

    // Create a modulator for the "mechanical" warble effect (25Hz)
    const modulator = this.audioContext.createOscillator();
    modulator.type = 'square';
    modulator.frequency.value = 25; 

    const modulatorGain = this.audioContext.createGain();
    modulatorGain.gain.value = 0.5; // Depth of modulation

    // Carrier oscillators (The bell tones)
    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 400;

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 450;

    // Main envelope gain for the ring pattern (2s ON, 4s OFF)
    const envelopeGain = this.audioContext.createGain();
    envelopeGain.connect(this.masterGain);

    // Connect modulation
    // We want the amplitude of the carriers to be modulated
    // Signal Flow: Carriers -> AM Gain -> Envelope Gain -> Master
    
    const amGain = this.audioContext.createGain();
    amGain.gain.value = 0.5; // Base amplitude
    
    // Connect modulator to AM Gain's gain parameter to vary amplitude
    modulator.connect(modulatorGain);
    modulatorGain.connect(amGain.gain);

    osc1.connect(amGain);
    osc2.connect(amGain);
    amGain.connect(envelopeGain);

    // Ring Pattern: 2s Ring, 4s Silence
    const ringDuration = 2.0;
    
    // Start sound
    osc1.start(now);
    osc2.start(now);
    modulator.start(now);

    // Envelope Control for Pulse
    envelopeGain.gain.setValueAtTime(1, now);
    envelopeGain.gain.setValueAtTime(1, now + ringDuration);
    envelopeGain.gain.linearRampToValueAtTime(0, now + ringDuration + 0.1);

    // Stop oscillators after ring duration to save CPU during silence
    osc1.stop(now + ringDuration + 0.1);
    osc2.stop(now + ringDuration + 0.1);
    modulator.stop(now + ringDuration + 0.1);

    this.oscillators = [osc1, osc2, modulator];
    this.gainNode = envelopeGain;

    // Loop
    this.timer = setTimeout(() => {
      this._playGriGriTone();
    }, 6000); // Standard 6s cycle (2s ring + 4s silence)
  }

  // Modern Digital Tone (Smoother)
  _playDigitalTone() {
    if (!this.isPlaying) return;
    const now = this.audioContext.currentTime;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    gain.connect(this.masterGain);

    osc1.type = 'sine';
    osc1.frequency.value = 400;
    osc2.type = 'sine';
    osc2.frequency.value = 600;

    osc1.connect(gain);
    osc2.connect(gain);

    // Pattern: 0.4s ON, 0.2s OFF, 0.4s ON, 2s OFF
    gain.gain.setValueAtTime(0, now);
    
    // First blip
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    
    // Second blip
    gain.gain.linearRampToValueAtTime(0, now + 0.7);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.8);
    gain.gain.linearRampToValueAtTime(0.5, now + 1.1);
    gain.gain.linearRampToValueAtTime(0, now + 1.2);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.0);
    osc2.stop(now + 3.0);

    this.oscillators = [osc1, osc2];
    this.gainNode = gain;

    this.timer = setTimeout(() => {
      this._playDigitalTone();
    }, 3000);
  }

  _playOutgoingTone() {
    if (!this.isPlaying) return;
    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    gain.connect(this.masterGain);

    osc.frequency.value = 440; // Standard A4

    osc.connect(gain);

    // 1s ON, 2s OFF
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.3, now + 1.0);
    gain.gain.linearRampToValueAtTime(0, now + 1.1);

    osc.start(now);
    osc.stop(now + 1.2);

    this.oscillators = [osc];
    this.gainNode = gain;

    this.timer = setTimeout(() => {
      this._playOutgoingTone();
    }, 3000);
  }
}

export const audioRingingService = new AudioRingingService();
