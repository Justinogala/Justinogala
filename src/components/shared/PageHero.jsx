
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { presets } from '@/utils/animations';

const PageHero = ({ 
  title, 
  subtitle, 
  children, 
  className, 
  align = 'center',
  backgroundImage 
}) => {
  return (
    <section className={cn(
      "relative pt-24 pb-20 lg:pt-32 lg:pb-24 overflow-hidden",
      backgroundImage ? "bg-cover bg-center" : "bg-bg-primary",
      className
    )}
    style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-bg-primary" />
      )}
      
      <div className="container mx-auto px-6 relative z-10">
        <div className={cn(
          "max-w-4xl mx-auto",
          align === 'center' ? 'text-center' : 'text-left'
        )}>
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-accent to-purple-600 leading-tight"
            {...presets.fadeInUp}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p 
              className="text-lg md:text-xl text-text-secondary mb-8 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {subtitle}
            </motion.p>
          )}
          {children && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageHero;
