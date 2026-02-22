
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AuthPasswordInput = ({
  label,
  id,
  placeholder = "Enter your password",
  value,
  onChange,
  error,
  isValid,
  disabled,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "flex w-full h-12 px-4 py-3 pr-12 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500",
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
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
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

          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <motion.div
              initial={false}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.2 }}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </motion.div>
          </button>
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

export default AuthPasswordInput;
