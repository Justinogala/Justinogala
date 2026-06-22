
import { useReducedMotion } from 'framer-motion';

// Easing functions
export const EASING = {
  easeOut: [0.215, 0.61, 0.355, 1],
  easeIn: [0.55, 0.055, 0.675, 0.19],
  easeInOut: [0.645, 0.045, 0.355, 1],
};

// Durations
export const DURATION = {
  FAST: 0.08,
  NORMAL: 0.15,
  SLOW: 0.3,
  SLOWER: 0.5,
};

// Variants
export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.NORMAL, ease: EASING.easeOut } },
  exit: { opacity: 0, transition: { duration: DURATION.FAST, ease: EASING.easeIn } },
};

export const SLIDE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.NORMAL, ease: EASING.easeOut } },
  exit: { opacity: 0, y: 20, transition: { duration: DURATION.FAST, ease: EASING.easeIn } },
};

export const SLIDE_DOWN = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.NORMAL, ease: EASING.easeOut } },
  exit: { opacity: 0, y: -20, transition: { duration: DURATION.FAST, ease: EASING.easeIn } },
};

export const SLIDE_LEFT = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: DURATION.NORMAL, ease: EASING.easeOut } },
  exit: { opacity: 0, x: 20, transition: { duration: DURATION.FAST, ease: EASING.easeIn } },
};

export const SLIDE_RIGHT = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: DURATION.NORMAL, ease: EASING.easeOut } },
  exit: { opacity: 0, x: -20, transition: { duration: DURATION.FAST, ease: EASING.easeIn } },
};

export const SCALE_UP = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATION.NORMAL, ease: EASING.easeOut } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: DURATION.FAST, ease: EASING.easeIn } },
};

export const STAGGER_CONTAINER = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const STAGGER_ITEM = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.NORMAL, ease: EASING.easeOut } },
};

// Presets for specific use cases
export const presets = {
  fadeInUp: SLIDE_UP,
  fadeInDown: SLIDE_DOWN,
  fadeInLeft: SLIDE_LEFT,
  fadeInRight: SLIDE_RIGHT,
  scaleIn: SCALE_UP,
  staggerContainer: STAGGER_CONTAINER,
  staggerItem: STAGGER_ITEM,
};

// Helper for hover effects
export const hoverEffects = {
  scale: { scale: 1.05, transition: { duration: 0.2 } },
  lift: { y: -4, transition: { duration: 0.2 } },
  glow: { boxShadow: "0px 10px 20px rgba(0,0,0,0.2)", transition: { duration: 0.2 } },
};

export const clickEffects = {
  tap: { scale: 0.95, transition: { duration: 0.1 } },
};
