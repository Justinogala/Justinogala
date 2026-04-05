
import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import UserSidebar from '@/components/UserSidebar';
import UserHeader from '@/components/UserHeader';
import MobileSearchOverlay from '@/components/search/MobileSearchOverlay';
import OnboardingWalkthrough from '@/components/OnboardingWalkthrough';
import UpdateNotificationBanner from '@/components/UpdateNotificationBanner';
import WhatsNewModal from '@/components/WhatsNewModal';
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
      
      {/* Global update notification banner */}
      <UpdateNotificationBanner />
      <WhatsNewModal />
      
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex font-sans transition-colors duration-200 pt-safe">
        
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
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-violet-50 via-indigo-50/80 to-purple-50 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-violet-100/60 dark:border-violet-800/30 px-6 py-8">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent dark:via-violet-500/30" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-indigo-200/30 to-transparent dark:from-indigo-700/10 rounded-full blur-2xl" />
                <div className="absolute top-0 left-8 w-20 h-20 bg-gradient-to-br from-violet-200/20 to-transparent dark:from-violet-700/10 rounded-full blur-xl" />
                <div className="relative text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-violet-300/50">
                      <span className="text-white text-[10px] font-bold">M</span>
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Munal AI</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
                    Your all-in-one meeting companion
                  </p>
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 flex-wrap">
                    <Link to="/meetings" className="text-[11px] text-violet-500/70 hover:text-violet-600 dark:text-violet-400/60 dark:hover:text-violet-300 transition-colors font-medium">Meetings</Link>
                    <span className="w-1 h-1 rounded-full bg-violet-300/60 dark:bg-violet-600/40 hidden sm:block" />
                    <Link to="/workspaces" className="text-[11px] text-violet-500/70 hover:text-violet-600 dark:text-violet-400/60 dark:hover:text-violet-300 transition-colors font-medium">Workspaces</Link>
                    <span className="w-1 h-1 rounded-full bg-violet-300/60 dark:bg-violet-600/40 hidden sm:block" />
                    <Link to="/messages" className="text-[11px] text-violet-500/70 hover:text-violet-600 dark:text-violet-400/60 dark:hover:text-violet-300 transition-colors font-medium">AI Assistant</Link>
                    <span className="w-1 h-1 rounded-full bg-violet-300/60 dark:bg-violet-600/40 hidden sm:block" />
                    <Link to="/settings" className="text-[11px] text-violet-500/70 hover:text-violet-600 dark:text-violet-400/60 dark:hover:text-violet-300 transition-colors font-medium">Settings</Link>
                  </div>
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
