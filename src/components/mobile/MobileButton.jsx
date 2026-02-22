
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const MobileButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled = false,
  fullWidth = false,
  icon: Icon,
  ...props 
}) => {
  const baseStyles = "relative min-h-[48px] px-6 rounded-lg font-medium text-base flex items-center justify-center transition-colors active:scale-95 touch-manipulation select-none";
  
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="mr-2 h-5 w-5" />}
      {children}
    </motion.button>
  );
};

export default MobileButton;
