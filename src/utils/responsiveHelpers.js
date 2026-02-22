
import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport matches a media query
 * @param {string} query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} - True if matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query, matches]);

  return matches;
};

/**
 * Hook to detect specific device breakpoints
 * @returns {Object} - { isMobile, isTablet, isDesktop, isLargeDesktop }
 */
export const useBreakpoints = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  return { isMobile, isTablet, isDesktop, isLargeDesktop };
};

/**
 * Helper to conditionally join class names based on responsive props
 * Not typically needed with Tailwind, but useful for complex logic
 */
export const getResponsiveClasses = (baseClasses, mobileClasses, desktopClasses) => {
  return `${baseClasses} ${mobileClasses} md:${desktopClasses}`;
};
