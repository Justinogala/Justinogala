
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AuthInput = ({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  isValid,
  disabled,
  className,
  ...props
}) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "flex w-full h-12 px-4 py-3 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error 
              ? "border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30" 
              : isValid
                ? "border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900/30"
                : "border-gray-200 dark:border-gray-700 focus:border-[#7C3AED] focus:ring-purple-200 dark:focus:ring-purple-900/30"
          )}
          {...props}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
              </motion.div>
            ) : isValid ? (
              <motion.div
                key="valid"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <Check className="w-5 h-5 text-green-500" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="text-xs text-red-500 ml-1 font-medium"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthInput;
