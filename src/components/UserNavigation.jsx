
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic, 
  Users, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut, 
  User, 
  Menu,
  X,
  MessageSquare,
  HardDrive,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import NotificationBell from '@/components/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const UserNavigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('munal_sessions');
    localStorage.removeItem('munal_auth');
    localStorage.removeItem('munal_refresh');
    localStorage.removeItem('munal_last_activity');
    window.location.href = '/';
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Transcriptions', icon: FileText, path: '/transcriptions' },
    { label: 'New Transcription', icon: Upload, path: '/transcription/new' },
    { label: 'Voice Chat', icon: Mic, path: '/voice-chat' },
    { label: 'Meetings', icon: Mic, path: '/meetings' },
    { label: 'Teams', icon: Users, path: '/workspaces' },
    { label: 'Files', icon: HardDrive, path: '/files' },
    { label: 'Support', icon: HelpCircle, path: '/support' },
  ];

  const secondaryNavItems = [
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-violet-100 dark:border-violet-900/30 h-16 shadow-sm shadow-violet-500/5 backdrop-blur-md bg-opacity-90">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600 dark:from-violet-400 dark:to-purple-300 hidden sm:block group-hover:from-violet-600 group-hover:to-purple-500 transition-all">Munal</span>
            </div>

            <div className="hidden xl:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group overflow-hidden",
                    isActive 
                      ? 'text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-md shadow-violet-500/20' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-300'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {!isActive && (
                        <span className="absolute inset-0 bg-violet-50 dark:bg-violet-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
                      )}
                      <item.icon className={cn("w-4 h-4 mr-2 relative z-10", isActive ? "text-white" : "text-gray-500 group-hover:text-violet-600 dark:text-gray-400 dark:group-hover:text-violet-400")} />
                      <span className="relative z-10">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
              onClick={() => navigate('/messages')}
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>

            <ThemeSwitcher />
            
            <NotificationBell />

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-violet-500/30 transition-all p-0 overflow-hidden">
                  <Avatar className="h-9 w-9 border border-violet-200 dark:border-violet-800">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900 dark:to-purple-900 text-violet-700 dark:text-violet-300 font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-violet-100 dark:border-violet-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl shadow-violet-500/10" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-violet-900 dark:text-violet-100">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-violet-100 dark:bg-violet-800" />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="focus:bg-violet-50 dark:focus:bg-violet-900/20 focus:text-violet-700 dark:focus:text-violet-300 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/messages')} className="focus:bg-violet-50 dark:focus:bg-violet-900/20 focus:text-violet-700 dark:focus:text-violet-300 cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="focus:bg-violet-50 dark:focus:bg-violet-900/20 focus:text-violet-700 dark:focus:text-violet-300 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-violet-100 dark:bg-violet-800" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="xl:hidden hover:bg-violet-50 dark:hover:bg-violet-900/20" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6 text-violet-600" /> : <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white dark:bg-slate-900 border-b border-violet-200 dark:border-violet-800 overflow-hidden shadow-xl"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                {[...navItems, ...secondaryNavItems].map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors
                      ${isActive 
                        ? 'text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-md shadow-violet-500/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20'}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-white" : "text-gray-500")} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
              <div className="pt-4 border-t border-violet-100 dark:border-violet-800">
                <Button variant="destructive" className="w-full justify-start shadow-md bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800" onClick={handleLogout}>
                  <LogOut className="w-5 h-5 mr-3" />
                  Log Out
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserNavigation;
