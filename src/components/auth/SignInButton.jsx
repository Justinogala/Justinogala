
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SignInButton = ({ status = 'idle', disabled }) => {
  // status: 'idle' | 'loading' | 'success' | 'error'

  const variants = {
    idle: { backgroundColor: '#3B82F6' },
    loading: { backgroundColor: '#3B82F6' },
    success: { backgroundColor: '#10B981' },
    error: { backgroundColor: '#EF4444', x: [0, -10, 10, -10, 10, 0] },
  };

  return (
    <motion.button
      type="submit"
      disabled={disabled || status === 'loading'}
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        ...variants[status]
      }}
      whileHover={status === 'idle' ? { scale: 1.01, backgroundColor: '#2563EB' } : {}}
      whileTap={status === 'idle' ? { scale: 0.98 } : {}}
      transition={{ 
        duration: 0.3, 
        backgroundColor: { duration: 0.3 } 
      }}
      className={cn(
        "w-full h-12 rounded-lg font-semibold text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 overflow-hidden relative",
        disabled && "opacity-70 cursor-not-allowed"
      )}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Signed in successfully</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Sign in failed</span>
          </motion.div>
        )}

        {status === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Sign In
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default SignInButton;
