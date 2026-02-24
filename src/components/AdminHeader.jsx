import React from 'react';
import { Menu, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';

const AdminHeader = ({ onMenuClick }) => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

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
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            Manage your application and users
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative max-w-xs w-full">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search admin..." 
            className="pl-9 h-9 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 rounded-full text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          
          <NotificationBell />

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                {adminUser?.username || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Super Admin
              </p>
            </div>
            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                AD
              </AvatarFallback>
            </Avatar>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 ml-1"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;