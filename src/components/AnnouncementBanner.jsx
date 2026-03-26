import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getAnnouncementStyle } from '@/config/announcementConfig';
import { useHeroSlide } from '@/contexts/HeroSlideContext';

// Banner color themes matching hero slides
const SLIDE_BANNER_THEMES = [
  { bg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700', btn: 'text-emerald-800 bg-white/90 hover:bg-white' },
  { bg: 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600', btn: 'text-amber-900 bg-white/90 hover:bg-white' },
  { bg: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700', btn: 'text-violet-800 bg-white/90 hover:bg-white' },
];

const ROTATE_INTERVAL = 5000;

const AnnouncementBanner = ({ announcements = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { slideIndex } = useHeroSlide();
  const location = useLocation();
  const isLanding = location.pathname === '/' || location.pathname === '';

  // On landing page, use hero-synced colors; elsewhere, use per-announcement styles
  const slideTheme = isLanding ? SLIDE_BANNER_THEMES[slideIndex % SLIDE_BANNER_THEMES.length] : null;

  const advance = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % announcements.length);
  }, [announcements.length]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(advance, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [advance, announcements.length]);

  if (!announcements.length) return null;

  const current = announcements[currentIndex];
  const Icon = current.icon;
  const styles = getAnnouncementStyle(current.type);

  return (
    <div className="relative z-[60] overflow-hidden" data-testid="announcement-banner">
      <div className={cn(
        "w-full px-4 py-3 md:py-3.5 shadow-lg relative backdrop-blur-md transition-all duration-700",
        slideTheme ? slideTheme.bg : styles.background
      )}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 md:gap-8 relative z-10">

          {/* Rotating content */}
          <div className="flex-1 relative h-6 md:h-7 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center gap-3 text-center md:text-left justify-center md:justify-start"
              >
                {Icon && (
                  <div className="hidden md:flex p-1.5 bg-white/20 rounded-full backdrop-blur-sm shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                  <span className="font-bold text-white tracking-tight text-sm md:text-base whitespace-nowrap">
                    {current.headline}
                  </span>
                  {current.subtext && (
                    <>
                      <span className="hidden md:inline text-white/60">&bull;</span>
                      <span className="text-white/90 text-xs md:text-sm font-medium truncate max-w-xs lg:max-w-lg">
                        {current.subtext}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action + dots */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Dots indicator */}
            {announcements.length > 1 && (
              <div className="hidden md:flex items-center gap-1.5">
                {announcements.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      i === currentIndex
                        ? "w-5 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                    )}
                    aria-label={`Announcement ${i + 1}`}
                  />
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`btn-${currentIndex}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                {current.buttonText && current.buttonLink && (
                  <Link to={current.buttonLink}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-md transition-all flex items-center gap-2 group",
                        slideTheme ? slideTheme.btn : styles.button
                      )}
                    >
                      {current.buttonText}
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                    </motion.button>
                  </Link>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
