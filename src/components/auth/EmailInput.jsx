
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const EmailInput = ({ value, onChange, error: externalError, disabled }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(value));
  }, [value]);

  const showError = (touched && !isValid && value.length > 0) || externalError;

  return (
    <motion.div 
      className="space-y-1.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Email Address
      </label>
      <div className="relative">
        <input
          id="email"
          type="email"
          value={value}
          onChange={(e) => {
            onChange(e);
            setTouched(true);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="you@example.com"
          className={cn(
            "w-full h-12 px-4 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 outline-none",
            showError 
              ? "border-red-500 text-red-900 dark:text-red-100 focus:ring-2 focus:ring-red-500/20" 
              : isFocused 
                ? "border-blue-500 ring-2 ring-blue-500/20 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          )}
          aria-invalid={showError}
          aria-describedby={showError ? "email-error" : undefined}
        />
        
        <AnimatePresence>
          {isValid && !showError && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
            >
              <Check className="w-5 h-5" />
            </motion.div>
          )}
          
          {showError && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
            >
              <AlertCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {showError && (
          <motion.p
            id="email-error"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="text-sm text-red-500 mt-1"
          >
            {externalError || "Please enter a valid email address"}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EmailInput;
