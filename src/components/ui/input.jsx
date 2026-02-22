
import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(({ 
  className, 
  label,
  error,
  type = "text",
  id,
  required = false,
  ...props 
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full group">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 group-focus-within:text-violet-600 dark:group-focus-within:text-violet-400 transition-colors"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={cn(
          "flex h-12 md:h-11 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/50 px-4 py-2", // Increased height for mobile
          "text-base md:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500", // Larger text on mobile to prevent zoom
          "focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 dark:focus:border-violet-500",
          "hover:border-violet-300 dark:hover:border-violet-700",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200 ease-in-out shadow-sm focus:shadow-lg focus:shadow-violet-500/10",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500"/>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
