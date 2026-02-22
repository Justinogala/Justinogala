
import React from 'react';
import { cn } from '@/lib/utils';
import '@/styles/heroAnimations.css';

const AnimatedHeroBackground = ({ 
  gradientFrom = 'from-blue-600', 
  gradientTo = 'to-purple-600',
  animationSpeed = 'normal',
  density = 'medium',
  className
}) => {
  // Config based on props
  const speedClass = animationSpeed === 'slow' ? 'duration-[15s]' : animationSpeed === 'fast' ? 'duration-[5s]' : 'duration-[10s]';
  
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none -z-10", className)}>
      {/* Base Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-10 animate-gradient-shift will-change-transform",
        gradientFrom,
        gradientTo
      )} />

      {/* Primary Floating Shapes - Visible on all devices */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] md:w-96 md:h-96 rounded-full bg-gradient-to-r from-white/10 to-transparent blur-3xl animate-hero-float-slow will-change-transform" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] md:w-96 md:h-96 rounded-full bg-gradient-to-l from-white/10 to-transparent blur-3xl animate-hero-float-slow delay-2000 will-change-transform" />

      {/* Secondary Shapes - Hidden on mobile for performance */}
      <div className="hidden md:block absolute top-[20%] right-[15%] w-64 h-64 rounded-full bg-gradient-to-b from-white/5 to-transparent blur-2xl animate-hero-pulse delay-1000" />
      <div className="hidden md:block absolute bottom-[20%] left-[15%] w-48 h-48 rounded-full bg-gradient-to-t from-white/5 to-transparent blur-2xl animate-hero-pulse delay-3000" />

      {/* Particles - Quantity based on density prop */}
      <div className="absolute inset-0">
        {[...Array(density === 'high' ? 20 : density === 'low' ? 5 : 10)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute rounded-full bg-white/20 animate-hero-float",
              i % 2 === 0 ? "animate-hero-float-slow" : "animate-hero-float-fast",
              // Hide some particles on small screens
              i > 4 ? "hidden md:block" : "block"
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.5 + 0.1
            }}
          />
        ))}
      </div>

      {/* Rotating Ring - Desktop only */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-hero-rotate-slow pointer-events-none" />

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/50 to-bg-primary" />
    </div>
  );
};

export default AnimatedHeroBackground;
