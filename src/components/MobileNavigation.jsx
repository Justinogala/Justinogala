
import React, { useState } from 'react';
import { Home, Calendar, Mic, FileText, Menu } from 'lucide-react';
import MobileTabBar from '@/components/mobile/MobileTabBar';
import MobileMenu from './MobileMenu';

const MobileNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    { icon: Home, label: 'Home', to: '/dashboard' },
    { icon: Calendar, label: 'Meetings', to: '/meetings' },
    { icon: Mic, label: 'Record', to: '/transcribe-new' },
    { icon: FileText, label: 'Files', to: '/files' },
  ];

  const menuItems = [
    { label: 'Dashboard', to: '/dashboard', icon: Home },
    { label: 'All Meetings', to: '/meetings', icon: Calendar },
    { label: 'Transcriptions', to: '/transcriptions', icon: Mic },
    { label: 'Workspaces', to: '/workspaces', icon: FileText },
    { label: 'Settings', to: '/settings', icon: Menu }, // Just using Menu icon as placeholder for settings
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border flex justify-around items-center h-[56px] pb-[env(safe-area-inset-bottom)]">
         {/* Custom Tab Bar Implementation to include Menu Trigger */}
         <MobileTabBar items={[
           ...mainTabs, 
           { 
             icon: Menu, 
             label: 'Menu', 
             to: '#menu', // Dummy route
             // Intercept click
           } 
         ]} className="relative border-none bg-transparent" />
         
         {/* Overlay transparent div on the last tab to handle click manually */}
         <div 
           className="absolute right-0 bottom-0 top-0 w-1/5 cursor-pointer z-50" 
           onClick={(e) => {
             e.preventDefault();
             setIsMenuOpen(true);
           }}
         />
      </div>

      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        items={menuItems} 
      />
    </>
  );
};

export default MobileNavigation;
