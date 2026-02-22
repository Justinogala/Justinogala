
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const AuthCheckbox = ({
  id,
  checked,
  onChange,
  label,
  error,
  disabled
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-start space-x-2">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="peer h-5 w-5 opacity-0 absolute cursor-pointer z-10"
          />
          <motion.div
            className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-colors duration-200",
              checked 
                ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500" 
                : error
                  ? "border-red-500 bg-white dark:bg-gray-800"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400"
            )}
            whileHover={!disabled ? { scale: 1.1 } : {}}
            whileTap={!disabled ? { scale: 0.9 } : {}}
          >
            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <label 
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none cursor-pointer select-none mt-1",
            error ? "text-red-500" : "text-gray-700 dark:text-gray-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </label>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 ml-7"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthCheckbox;
