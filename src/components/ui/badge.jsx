
import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig = {
  processing: {
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30',
    label: 'Processing'
  },
  completed: {
    className: 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
    label: 'Completed'
  },
  failed: {
    className: 'bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
    label: 'Failed'
  },
  primary: {
    className: 'bg-violet-500 text-white border-violet-600 shadow-md shadow-violet-500/20',
    label: 'Primary'
  },
  secondary: {
    className: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
    label: 'Secondary'
  }
};

export const Badge = ({ status, className, children, variant = 'default' }) => {
  // Use status config if status is provided
  if (status && statusConfig[status]) {
    const config = statusConfig[status];
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all hover:scale-105',
          config.className,
          className
        )}
      >
        {children || config.label}
      </span>
    );
  }

  // Use variant styling if no status
  const variants = {
    default: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
    outline: 'bg-transparent text-violet-600 border-violet-300 dark:text-violet-400 dark:border-violet-700',
    success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    destructive: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    purple: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-transparent shadow-sm shadow-violet-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all hover:scale-105',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
};
