
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const Card = React.forwardRef(({ 
  className, 
  children, 
  hover = false,
  animate = false,
  variant = 'default', // default, purple, outlined
  ...props 
}, ref) => {
  const CardComponent = (hover || animate) ? motion.div : 'div';
  
  const motionProps = hover ? {
    whileHover: { 
      y: -4, 
      scale: 1.005, 
      boxShadow: "0 20px 25px -5px rgba(124, 58, 237, 0.15), 0 8px 10px -6px rgba(124, 58, 237, 0.1)" 
    },
    transition: { type: "spring", stiffness: 300, damping: 20 }
  } : {};

  const variantStyles = {
    default: "bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 border-l-4 border-l-transparent hover:border-l-violet-500",
    purple: "bg-white dark:bg-slate-900 border-violet-100 dark:border-violet-900/50 shadow-lg shadow-violet-500/5 border-l-4 border-l-violet-500",
    outlined: "bg-transparent border-violet-200 dark:border-violet-800 border-l-4 border-l-violet-500/50",
    gradient: "bg-gradient-to-br from-white to-violet-50 dark:from-slate-900 dark:to-slate-800 border-violet-100 dark:border-violet-900 shadow-lg shadow-violet-500/10"
  };

  return (
    <CardComponent
      ref={ref}
      className={cn(
        "rounded-xl shadow-sm border p-6 transition-all duration-300",
        variantStyles[variant] || variantStyles.default,
        "hover:shadow-violet-500/10 dark:hover:shadow-violet-900/20", // General hover glow
        className
      )}
      {...motionProps}
      {...(animate && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      })}
      {...props}
    >
      {children}
    </CardComponent>
  );
});

Card.displayName = "Card";

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4 border-b border-gray-50 dark:border-gray-800/50 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400 mt-2", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-800", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
