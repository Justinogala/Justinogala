
import React from 'react';
import { motion } from 'framer-motion';
import { presets, DURATION, EASING } from '@/utils/animations';

const PageTransition = ({ children, className = "" }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0, y: 20 },
        animate: { 
          opacity: 1, 
          y: 0, 
          transition: { 
            duration: DURATION.NORMAL, 
            ease: EASING.easeOut,
            staggerChildren: 0.1 
          } 
        },
        exit: { 
          opacity: 0, 
          y: -20, 
          transition: { 
            duration: DURATION.FAST, 
            ease: EASING.easeIn 
          } 
        }
      }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
