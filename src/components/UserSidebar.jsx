
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mic, 
  FileText, 
  Briefcase, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  HardDrive, 
  CreditCard, 
  DollarSign, 
  Ticket, 
  MessageSquare, 
  Video,
  CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const UserSidebar = ({ className, onClose, isMobile }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      setCollapsed(!collapsed);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CircleDot, label: 'Quick Record', path: '/quick-record', highlight: true },
    { icon: Mic, label: 'Meetings', path: '/meetings' },
    { icon: FileText, label: 'Transcriptions', path: '/transcriptions' },
    { icon: Mic, label: 'Voice Chat', path: '/voice-chat' },
    { icon: Briefcase, label: 'Workspaces', path: '/workspaces' },
    { icon: MessageSquare, label: 'Chat', path: '/workspace/chat' },
    { icon: Video, label: 'Calls', path: 'https://conferencing.jizira.com/', external: true },
    { icon: HardDrive, label: 'Files', path: '/files' },
  ];

  const paymentItems = [
    { icon: CreditCard, label: 'Payment Methods', path: '/user/payment-methods' },
    { icon: DollarSign, label: 'History', path: '/user/payment-history' },
  ];

  // Mobile sidebar is fixed width, desktop can collapse
  const sidebarWidth = collapsed ? "w-20" : "w-64";
  const mobileWidth = "w-[280px]";

  return (
    <motion.div 
      className={cn(
        "flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 shadow-xl lg:shadow-none",
        isMobile ? mobileWidth : sidebarWidth,
        className
      )}
      initial={false}
      animate={{ width: isMobile ? 280 : (collapsed ? 80 : 256) }}
    >
      <div className={cn("p-4 flex items-center h-16 border-b border-gray-100 dark:border-gray-800", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
            <span className="font-bold text-lg text-gray-900 dark:text-white truncate">Munal</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => navigate('/dashboard')}>M</div>
        )}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleCollapse} className="hidden lg:flex h-6 w-6 ml-auto">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        
        {/* Main Menu */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden touch-target",
                item.highlight && !isActive
                  ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5",
                isActive && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0", 
                collapsed ? "mr-0" : "mr-1",
                item.highlight && "text-rose-500"
              )} />
              {!collapsed && (
                <span className="truncate text-sm md:text-base">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Payments Section */}
        <div className="space-y-1">
           {!collapsed && <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payments</p>}
           {collapsed && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 mb-2"></div>}
           
           {paymentItems.map((item) => (
             <NavLink
               key={item.path}
               to={item.path}
               onClick={isMobile ? onClose : undefined}
               className={({ isActive }) => cn(
                 "flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden touch-target",
                 "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5",
                 isActive && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium",
                 collapsed && "justify-center px-2"
               )}
               title={collapsed ? item.label : undefined}
             >
               <item.icon className={cn("w-5 h-5 shrink-0", collapsed ? "mr-0" : "mr-1")} />
               {!collapsed && (
                 <span className="truncate text-sm md:text-base">
                   {item.label}
                 </span>
               )}
             </NavLink>
           ))}
        </div>

        {/* Support & Settings Group */}
        <div className="space-y-1">
           {!collapsed && <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support</p>}
           {collapsed && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 mb-2"></div>}
           
           {[
             { icon: Ticket, label: 'Support Tickets', path: '/support-tickets' },
             { icon: Settings, label: 'Settings', path: '/settings' }
           ].map((item) => (
             <NavLink
               key={item.path}
               to={item.path}
               onClick={isMobile ? onClose : undefined}
               className={({ isActive }) => cn(
                 "flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden touch-target",
                 "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/5",
                 isActive && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium",
                 collapsed && "justify-center px-2"
               )}
               title={collapsed ? item.label : undefined}
             >
               <item.icon className={cn("w-5 h-5 shrink-0", collapsed ? "mr-0" : "mr-1")} />
               {!collapsed && (
                 <span className="truncate text-sm md:text-base">
                   {item.label}
                 </span>
               )}
             </NavLink>
           ))}
        </div>

      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 pb-safe">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {user?.name?.charAt(0) || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          )}
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
        {collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-full mt-2 text-gray-400 hover:text-red-500"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default UserSidebar;
