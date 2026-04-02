
import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import UserSidebar from '@/components/UserSidebar';
import UserHeader from '@/components/UserHeader';
import MobileSearchOverlay from '@/components/search/MobileSearchOverlay';
import OnboardingWalkthrough from '@/components/OnboardingWalkthrough';
import { motion, AnimatePresence } from 'framer-motion';

const UserLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Hide header on Settings page specifically as per requirement
  const showHeader = location.pathname !== '/settings';

  return (
    <>
      <Helmet>
        <title>Dashboard - Munal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex font-sans transition-colors duration-200">
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar - Mobile: Fixed drawer, Desktop: Static */}
        <div className={`
          fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:static lg:block transition-transform duration-300 ease-in-out h-full
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <UserSidebar 
            onClose={() => setMobileMenuOpen(false)} 
            isMobile={true} // Passed as prop to adjust styling if needed, mainly for drawer behavior
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
          {showHeader && (
            <UserHeader onMenuClick={() => setMobileMenuOpen(true)} />
          )}
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden pb-safe">
            <div className="max-w-7xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Outlet />
            </div>

            {/* Page Footer */}
            <div className="max-w-7xl mx-auto mt-8" data-testid="page-footer">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200/60 dark:border-gray-800/60" />
                </div>
                <div className="relative flex justify-center">
                  <div className="px-4 py-1 bg-gray-50 dark:bg-slate-950 rounded-full">
                    <div className="w-8 h-1 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 opacity-60" />
                  </div>
                </div>
              </div>
              <div className="text-center pt-6 pb-10">
                <p className="text-xs text-gray-400 dark:text-gray-500 tracking-wide">
                  Munal AI &middot; Your all-in-one meeting companion
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <Link to="/meetings" className="text-[11px] text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors">Meetings</Link>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <Link to="/workspaces" className="text-[11px] text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors">Workspaces</Link>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <Link to="/messages" className="text-[11px] text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors">AI Assistant</Link>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <Link to="/settings" className="text-[11px] text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors">Settings</Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <MobileSearchOverlay />
      <OnboardingWalkthrough />
    </>
  );
};

export default UserLayout;
