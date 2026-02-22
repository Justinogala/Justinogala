import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const images = [
  {
    url: "https://images.unsplash.com/photo-1677078610588-aed2834ad968",
    alt: "Team collaborating in video meeting",
    title: "Seamless Team Collaboration"
  },
  {
    url: "https://images.unsplash.com/photo-1687125179195-e360254bf800", // New image URL
    alt: "Cute illustration of people working together with a laptop and coffee", // Updated alt text
    title: "Collaborative Work Environment" // Updated title
  },
  {
    url: "https://images.unsplash.com/photo-1552581234-26160f608093",
    alt: "Diverse team collaborating during a meeting",
    title: "Diverse Team Meeting" // Added title for consistency
  },
  {
    url: "https://images.unsplash.com/photo-1570126618953-d437176e8c79",
    alt: "Modern office workspace environment",
    title: "Modern Office Workspace" // Added title for consistency
  },
  {
    url: "https://images.unsplash.com/photo-1540764016766-8166f52bfbcf", // New image URL
    alt: "Cute illustration of a person creating with colorful thought bubbles", // Updated alt text
    title: "Creative Idea Generation" // Updated title
  }
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback((newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;
      return nextIndex;
    });
  }, []);

  const nextSlide = useCallback(() => paginate(1), [paginate]);
  const prevSlide = useCallback(() => paginate(-1), [paginate]);

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl bg-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Image Carousel"
    >
      {/* Responsive Container Height */}
      <div className="h-[250px] md:h-[350px] lg:h-[450px] w-full relative">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={currentIndex}
            src={images[currentIndex].url}
            alt={images[currentIndex].alt}
            title={images[currentIndex].title}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.8 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                nextSlide();
              } else if (swipe > swipeConfidenceThreshold) {
                prevSlide();
              }
            }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80"; // Fallback
            }}
          />
        </AnimatePresence>

        {/* Gradient Overlay for Text Readability (Optional but good for contrast) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {/* Arrow Controls */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white/50"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white/50"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400",
                currentIndex === index 
                  ? "w-3 h-3 bg-blue-500 scale-110" 
                  : "w-2 h-2 bg-white/60 hover:bg-white"
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={currentIndex === index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;