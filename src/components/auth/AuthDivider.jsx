
import React from 'react';
import { motion } from 'framer-motion';

const AuthDivider = ({ text = "Or continue with" }) => {
  return (
    <motion.div 
      className="relative my-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-purple-200 dark:border-purple-900/30"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-medium">
          {text}
        </span>
      </div>
    </motion.div>
  );
};

export default AuthDivider;
