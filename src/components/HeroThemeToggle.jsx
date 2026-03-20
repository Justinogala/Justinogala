import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { THEMES } from '@/styles/theme';
import { motion } from 'framer-motion';

const HeroThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === THEMES.DARK;

  return (
    <motion.button
      data-testid="hero-theme-toggle"
      onClick={toggleTheme}
      className="fixed bottom-24 right-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/15 backdrop-blur-xl shadow-2xl transition-colors cursor-pointer group"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(30,27,75,0.85), rgba(88,28,135,0.6))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(237,233,254,0.85))',
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Track */}
      <div className="relative w-12 h-6 rounded-full overflow-hidden" style={{
        background: isDark
          ? 'linear-gradient(90deg, #1e1b4b, #312e81)'
          : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
      }}>
        {/* Stars (dark mode) */}
        {isDark && (
          <>
            <div className="absolute top-1 left-1.5 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse" />
            <div className="absolute top-3 left-3 w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1.5 left-5 w-0.5 h-0.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}

        {/* Thumb */}
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
          animate={{ x: isDark ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
              : 'linear-gradient(135deg, #fef3c7, #fbbf24)',
          }}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-white" />
          ) : (
            <Sun className="w-3 h-3 text-amber-700" />
          )}
        </motion.div>
      </div>

      {/* Label */}
      <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-violet-200' : 'text-gray-700'}`}>
        {isDark ? 'Dark' : 'Light'}
      </span>
    </motion.button>
  );
};

export default HeroThemeToggle;
