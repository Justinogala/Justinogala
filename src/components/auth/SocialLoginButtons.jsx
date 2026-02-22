
import React from 'react';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';

const SocialButton = ({ icon: Icon, label, color, delay }) => (
  <motion.button
    type="button"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.02, backgroundColor: 'var(--hover-bg)' }}
    whileTap={{ scale: 0.98 }}
    className="flex items-center justify-center h-12 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    aria-label={`Sign in with ${label}`}
  >
    <Icon className="w-5 h-5" style={{ color }} />
  </motion.button>
);

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    <g fill="none" fillRule="evenodd">
      <path d="M20.64 12.2c0-.63-.06-1.25-.16-1.84H12v3.49h4.84a4.13 4.13 0 0 1-1.8 2.71v2.26h2.92a8.7 8.7 0 0 0 2.68-6.62z" fill="#4285F4" />
      <path d="M12 21a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.09-2.85h-3v2.33A9 9 0 0 0 12 21z" fill="#34A853" />
      <path d="M6.96 13.71a5.41 5.41 0 0 1 0-3.42V7.96h-3a9 9 0 0 0 0 8.08l3-2.33z" fill="#FBBC05" />
      <path d="M12 5.38c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 3.96 7.96l3 2.33A5.4 5.4 0 0 1 12 5.38z" fill="#EA4335" />
    </g>
  </svg>
);

const MicrosoftIcon = (props) => (
  <svg viewBox="0 0 23 23" width="23" height="23" {...props}>
    <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
);

const SocialLoginButtons = () => {
  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      <SocialButton icon={GoogleIcon} label="Google" delay={0.6} />
      <SocialButton icon={Github} label="GitHub" color="var(--text-primary)" delay={0.7} />
      <SocialButton icon={MicrosoftIcon} label="Microsoft" delay={0.8} />
    </div>
  );
};

export default SocialLoginButtons;
