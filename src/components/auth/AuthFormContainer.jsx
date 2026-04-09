
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthFormContainer = ({ 
  children, 
  heading, 
  subheading, 
  footerLink 
}) => {
  return (
    <div className="w-full lg:w-1/2 p-6 sm:p-12 bg-white dark:bg-slate-950 lg:min-h-screen lg:flex lg:items-center lg:justify-center">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] mx-auto space-y-6"
      >
        {/* Mobile Logo — visible only when sidebar is hidden */}
        <Link to="/" className="flex items-center gap-2.5 lg:hidden mb-2" data-testid="auth-mobile-logo">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/25">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600">Munal</span>
        </Link>

        <div className="text-center lg:text-left space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{heading}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-base">{subheading}</p>
        </div>

        {children}

        {footerLink && (
          <div className="mt-4 -mx-6 sm:-mx-12 px-6 sm:px-12 py-5 bg-violet-50/80 dark:bg-violet-950/30 border-t border-violet-100 dark:border-violet-900/40 rounded-b-2xl">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-violet-600 to-purple-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                {footerLink.text}{' '}
                <button 
                  onClick={footerLink.onClick} 
                  className="font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors cursor-pointer hover:underline"
                >
                  {footerLink.linkText}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthFormContainer;
