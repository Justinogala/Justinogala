
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
          </main>
        </div>
      </div>
      <MobileSearchOverlay />
      <OnboardingWalkthrough />
    </>
  );
};

export default UserLayout;
