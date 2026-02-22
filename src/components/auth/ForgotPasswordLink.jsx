
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ForgotPasswordLink = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <Link 
        to="/password-reset" 
        className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition-all duration-300"
      >
        Forgot password?
      </Link>
    </motion.div>
  );
};

export default ForgotPasswordLink;
