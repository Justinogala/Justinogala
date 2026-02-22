
/**
 * Service to handle video background processing with smooth transitions.
 * Uses Canvas API to combine video stream with background images/effects.
 */
class BackgroundProcessor {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.sourceVideo = null;
    this.animationFrameId = null;
    
    // Current effect state
    this.activeEffect = { type: 'none' }; 
    
    // Transition state
    this.previousEffect = null;
    this.transitionStartTime = 0;
    this.transitionDuration = 300; // ms
    this.isTransitioning = false;

    // Resources
    this.backgroundImage = new Image();
    this.previousBackgroundImage = new Image();
    
    // Stream
    this.processedStream = null;
  }

  initialize(sourceVideoElement) {
    if (this.animationFrameId) this.stop();

    this.sourceVideo = sourceVideoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    // Set initial dimensions
    this.canvas.width = 640; 
    this.canvas.height = 480;

    // Start processing loop
    this.processFrame();

    return this.canvas.captureStream(30); // 30 FPS
  }

  setEffect(effect) {
    // If same effect, do nothing
    if (this.activeEffect.id === effect.id) return;

    // Start transition
    this.previousEffect = { ...this.activeEffect };
    this.activeEffect = effect;
    
    // Handle images
    if (this.previousEffect.type === 'image' && this.previousEffect.src) {
        this.previousBackgroundImage.src = this.previousEffect.src;
    }

    if (effect.type === 'image' && effect.src) {
      const newImg = new Image();
      newImg.crossOrigin = 'Anonymous';
      newImg.src = effect.src;
      newImg.onload = () => {
        this.backgroundImage = newImg;
      };
    }

    this.isTransitioning = true;
    this.transitionStartTime = performance.now();
  }

  processFrame = () => {
    if (!this.sourceVideo || !this.ctx) return;

    // Ensure canvas size matches video
    if (this.sourceVideo.videoWidth > 0 && this.canvas.width !== this.sourceVideo.videoWidth) {
      this.canvas.width = this.sourceVideo.videoWidth;
      this.canvas.height = this.sourceVideo.videoHeight;
    }

    const { width, height } = this.canvas;
    const now = performance.now();
    let transitionProgress = 0;

    // Calculate transition
    if (this.isTransitioning) {
      const elapsed = now - this.transitionStartTime;
      transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
      
      if (transitionProgress >= 1) {
        this.isTransitioning = false;
        this.previousEffect = null;
      }
    }

    // Draw Helper
    const drawEffect = (effect, img, alpha = 1) => {
      this.ctx.globalAlpha = alpha;
      
      if (effect.type === 'none') {
        this.ctx.drawImage(this.sourceVideo, 0, 0, width, height);
      } 
      else if (effect.type === 'blur') {
        this.ctx.filter = `blur(${effect.intensity === 'heavy' ? '20px' : '8px'})`;
        this.ctx.drawImage(this.sourceVideo, 0, 0, width, height);
        this.ctx.filter = 'none';
      } 
      else if (effect.type === 'image') {
        // 1. Draw Background
        if (img && img.complete && img.naturalWidth > 0) {
          this.ctx.drawImage(img, 0, 0, width, height);
        } else {
          this.ctx.fillStyle = '#111';
          this.ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw Video (Ghosting simulation)
        // In production, use segmentation mask here
        this.ctx.globalAlpha = alpha * 0.85; // Slight transparency for ghosting effect
        this.ctx.drawImage(this.sourceVideo, 0, 0, width, height);
      }
    };

    // Render logic
    this.ctx.clearRect(0, 0, width, height);

    if (this.isTransitioning && this.previousEffect) {
      // Draw previous effect fading out
      drawEffect(this.previousEffect, this.previousBackgroundImage, 1.0);
      
      // Draw new effect fading in
      drawEffect(this.activeEffect, this.backgroundImage, transitionProgress);
    } else {
      // Draw active effect
      drawEffect(this.activeEffect, this.backgroundImage, 1.0);
    }

    // Reset alpha
    this.ctx.globalAlpha = 1.0;

    this.animationFrameId = requestAnimationFrame(this.processFrame);
  };

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.sourceVideo = null;
    this.canvas = null;
    this.ctx = null;
  }
}

export const backgroundProcessor = new BackgroundProcessor();
