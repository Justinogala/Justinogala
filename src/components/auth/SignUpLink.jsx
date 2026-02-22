
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const SignUpLink = () => {
  return (
    <motion.div 
      className="mt-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link 
          to="/signup" 
          className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-all duration-300"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  );
};

export default SignUpLink;
