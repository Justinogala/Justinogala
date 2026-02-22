
import { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export const useInView = (options = { threshold: 0.1, rootMargin: '0px' }) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // If user prefers reduced motion, always show content immediately
    if (shouldReduceMotion) {
      setIsInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(element); // Trigger once animation
      }
    }, options);

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin, shouldReduceMotion]);

  return { ref, isInView };
};
