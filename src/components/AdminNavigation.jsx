import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  Zap,
  Key,
  Database,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminNavigation = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Integrations', icon: Zap, path: '/admin/integrations' },
    { label: 'API Settings', icon: Key, path: '/admin/api-settings' },
    { label: 'API Logs', icon: Database, path: '/admin/api-logs' },
    { label: 'Int. Logs', icon: List, path: '/admin/integration-logs' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-slate-900 border-b border-violet-500/20 h-16 shadow-lg shadow-violet-900/20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/admin/dashboard')}>
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:bg-violet-500 transition-colors">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block group-hover:text-violet-300 transition-colors">Admin Portal</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                      ? 'text-white bg-violet-600/50 border border-violet-500/50 shadow-sm shadow-violet-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-violet-500/20'}
                `}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeSwitcher />
            
            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

            {/* Admin Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-violet-500/20">
                  <Avatar className="h-9 w-9 border border-violet-500/50">
                    <AvatarFallback className="bg-violet-600 text-white font-medium">
                      {adminUser?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-900 text-white border-violet-500/30" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">{adminUser?.name}</p>
                    <p className="text-xs leading-none text-gray-400">{adminUser?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-violet-500/30" />
                <DropdownMenuItem className="focus:bg-violet-600/50 focus:text-white cursor-pointer" onClick={() => navigate('/admin/profile')}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-violet-600/50 focus:text-white cursor-pointer" onClick={() => navigate('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-violet-500/30" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-violet-500/20" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="lg:hidden bg-slate-900 border-b border-violet-500/30 overflow-hidden text-white"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors
                      ${isActive 
                        ? 'text-white bg-violet-600/50 border border-violet-500/50' 
                        : 'text-gray-400 hover:text-white hover:bg-violet-500/20'}
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <div className="pt-4 border-t border-violet-500/30">
                <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={handleLogout}>
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

export default AdminNavigation;