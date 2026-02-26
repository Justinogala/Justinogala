import React from 'react';
import { Menu, Search, LogOut, Bell, Command, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '@/components/NotificationBell';
import { motion } from 'framer-motion';

const AdminHeader = ({ onMenuClick }) => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">
              Control Center
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            Manage your platform and users
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl text-gray-400 text-sm cursor-pointer hover:bg-gray-200/80 dark:hover:bg-slate-700/80 transition-colors group border border-gray-200/50 dark:border-gray-700/50 w-64">
            <Search className="w-4 h-4" />
            <span className="flex-1 text-gray-500">Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-[10px] font-medium shadow-sm flex items-center gap-0.5">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />
          
          <NotificationBell />

          <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-1 hidden sm:block" />

          <motion.div 
            className="flex items-center gap-3 pl-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                  {adminUser?.username || 'Admin'}
                </p>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                Super Admin
              </p>
            </div>
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-indigo-500/20 shadow-md cursor-pointer hover:ring-indigo-500/40 transition-all">
                <AvatarImage src={adminUser?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white font-bold text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="h-9 w-9 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
