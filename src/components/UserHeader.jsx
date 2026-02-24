import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';

const UserHeader = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Get title based on current path
  const getPageTitle = (pathname) => {
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/meetings')) return 'Meetings';
    if (pathname.includes('/transcriptions')) return 'Transcriptions';
    if (pathname.includes('/workspaces')) return 'Workspaces';
    if (pathname.includes('/files')) return 'Files';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/support')) return 'Support';
    return 'Dashboard';
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex items-center relative max-w-xs w-full">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-9 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-violet-500 focus:border-violet-500 rounded-full text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          
          <NotificationBell />

          <Link to="/settings">
             <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

          <Link to="/profile" className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;