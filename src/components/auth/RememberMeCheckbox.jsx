
import React from 'react';
import { motion } from 'framer-motion';

const RememberMeCheckbox = ({ checked, onChange }) => {
  return (
    <motion.div 
      className="flex items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex items-center"
      >
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </motion.div>
      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        Remember me
      </label>
    </motion.div>
  );
};

export default RememberMeCheckbox;
