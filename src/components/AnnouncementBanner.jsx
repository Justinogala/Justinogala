import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getAnnouncementStyle } from '@/config/announcementConfig';

const AnnouncementBanner = ({
  id,
  type = 'promotional',
  icon: Icon,
  headline,
  subtext,
  buttonText,
  buttonLink,
  buttonAction,
}) => {
  const styles = getAnnouncementStyle(type);

  const handleAction = () => {
    if (buttonAction) {
      buttonAction();
    }
  };

  return (
    <div className="relative z-[60] overflow-hidden">
      <div className={cn(
        "w-full px-4 py-3 md:py-3.5 shadow-lg relative backdrop-blur-md",
        styles.background
      )}>
        {/* Subtle overlay pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>
        
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 md:gap-8 relative z-10">
          
          {/* Content Area */}
          <div className="flex items-center gap-3 text-center md:text-left justify-center md:justify-start flex-1">
            {Icon && (
              <div className="hidden md:flex p-1.5 bg-white/20 rounded-full backdrop-blur-sm shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="font-bold text-white tracking-tight text-sm md:text-base">
                {headline}
              </span>
              {subtext && (
                <>
                  <span className="hidden md:inline text-white/60">&bull;</span>
                  <span className="text-white/90 text-xs md:text-sm font-medium">
                    {subtext}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-4 shrink-0">
            {(buttonText && (buttonLink || buttonAction)) && (
              buttonLink ? (
                <Link to={buttonLink}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-md transition-all flex items-center gap-2 group",
                      styles.button
                    )}
                  >
                    {buttonText}
                    <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  onClick={handleAction}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-md transition-all flex items-center gap-2 group",
                    styles.button
                  )}
                >
                  {buttonText}
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
