
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AuthButton = ({
  children,
  onClick,
  type = "button",
  state = "idle", // idle, loading, success, error
  disabled,
  className,
}) => {
  const isIdle = state === 'idle';
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || !isIdle}
      className={cn(
        "relative w-full h-12 rounded-xl font-semibold text-white shadow-md transition-all duration-300 overflow-hidden",
        isIdle && "bg-[#7C3AED] hover:bg-[#6D28D9] hover:shadow-purple-500/25",
        isLoading && "bg-[#7C3AED] cursor-wait opacity-90",
        isSuccess && "bg-green-500 hover:bg-green-600",
        isError && "bg-red-500 hover:bg-red-600",
        disabled && "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none",
        className
      )}
      whileTap={isIdle && !disabled ? { scale: 0.98 } : {}}
      animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading...</span>
            </motion.div>
          ) : isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[3px]" />
              <span>Success</span>
            </motion.div>
          ) : isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Error</span>
            </motion.div>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Glossy effect */}
      {!disabled && !isLoading && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 pointer-events-none" />
      )}
    </motion.button>
  );
};

export default AuthButton;
