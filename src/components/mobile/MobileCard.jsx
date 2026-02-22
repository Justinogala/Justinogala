
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const MobileCard = ({ 
  children, 
  className, 
  onClick,
  ...props 
}) => {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm p-4",
        onClick && "active:bg-accent/50 transition-colors cursor-pointer touch-manipulation",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default MobileCard;
