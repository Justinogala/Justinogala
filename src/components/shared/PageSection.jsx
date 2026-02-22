
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useInView } from '@/hooks/useInView';

const PageSection = ({ 
  children, 
  className, 
  background = 'default', // default, alt, gradient
  id
}) => {
  const { ref, isInView } = useInView();

  const bgClasses = {
    default: 'bg-bg-primary',
    alt: 'bg-bg-secondary/50',
    gradient: 'bg-gradient-to-b from-bg-primary to-bg-secondary',
  };

  return (
    <section 
      id={id}
      ref={ref}
      className={cn(
        "py-16 md:py-24",
        bgClasses[background],
        className
      )}
    >
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default PageSection;
