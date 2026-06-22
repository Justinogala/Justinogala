
import React from 'react';
import { motion } from 'framer-motion';
import { presets, DURATION, EASING } from '@/utils/animations';

const PageTransition = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
