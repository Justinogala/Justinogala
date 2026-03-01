import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Mic, FileText, Briefcase, Settings, LogOut, ChevronLeft, 
  ChevronRight, User, HardDrive, CreditCard, DollarSign, MessageSquare, Video,
  CircleDot, ExternalLink, ChevronDown, ChevronUp, Coins, Tag, Receipt, Volume2,
  Sparkles, Crown, Bell, Search, Command, Zap, Shield, Star, Ticket, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const UserSidebar = ({ className, onClose, isMobile }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleCollapse = () => {
    if (!isMobile) setCollapsed(!collapsed);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { icon: CircleDot, label: 'Quick Record', path: '/quick-record', highlight: true, badge: 'NEW', gradient: 'from-rose-500 to-pink-500' },
    { icon: Volume2, label: 'Text to Audio', path: '/text-to-audio', gradient: 'from-violet-500 to-purple-500' },
    { icon: Calendar, label: 'Calendar', path: '/calendar', gradient: 'from-indigo-500 to-violet-500' },
    { icon: Mic, label: 'Meetings', path: '/meetings', gradient: 'from-emerald-500 to-green-500' },
    { icon: FileText, label: 'Transcriptions', path: '/transcriptions', gradient: 'from-amber-500 to-orange-500' },
    { icon: Mic, label: 'Voice Chat', path: '/voice-chat', gradient: 'from-indigo-500 to-blue-500' },
    { icon: Briefcase, label: 'Workspaces', path: '/workspaces', gradient: 'from-teal-500 to-cyan-500' },
    { icon: MessageSquare, label: 'Chat', path: '/workspace/chat', gradient: 'from-pink-500 to-rose-500' },
    { icon: HardDrive, label: 'Files', path: '/files', gradient: 'from-slate-500 to-gray-500' },
  ];

  const paymentSubItems = [
    { icon: CreditCard, label: 'Payment Methods', path: '/user/payment-methods' },
    { icon: DollarSign, label: 'Plans & Billing', path: '/user/plans' },
    { icon: Tag, label: 'My Coupons', path: '/user/coupons' },
    { icon: Receipt, label: 'Transaction History', path: '/user/transactions' },
  ];

  const getPlanBadge = () => {
    const plan = user?.plan || 'Free';
    if (plan === 'Enterprise') return { icon: Crown, color: 'from-amber-400 to-orange-500', label: 'Enterprise' };
    if (plan === 'Pro') return { icon: Sparkles, color: 'from-violet-400 to-purple-500', label: 'Pro' };
    return null;
  };

  const planBadge = getPlanBadge();

  return (
    <motion.div 
      className={cn(
        "flex flex-col h-full bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-r border-gray-200/50 dark:border-gray-800/50 transition-all duration-300",
        isMobile ? "w-[280px] shadow-2xl" : collapsed ? "w-20" : "w-72",
        className
      )}
      initial={false}
      animate={{ width: isMobile ? 280 : (collapsed ? 80 : 288) }}
    >
      {/* Header */}
      <div className={cn(
        "p-4 flex items-center h-16 border-b border-gray-200/50 dark:border-gray-800/50",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <motion.div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/30">
                M
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">Munal</span>
              <p className="text-[10px] text-gray-400 -mt-0.5">AI Workspace</p>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/30 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            M
          </motion.div>
        )}
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse} 
            className="hidden lg:flex h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Search Bar (when expanded) */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100/80 dark:bg-slate-800/80 rounded-xl text-gray-400 text-sm cursor-pointer hover:bg-gray-200/80 dark:hover:bg-slate-700/80 transition-colors group">
            <Search className="w-4 h-4" />
            <span className="flex-1">Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-[10px] font-medium shadow-sm group-hover:shadow">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 py-2 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        
        {/* Main Menu */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Navigation</p>
          )}
          {menuItems.map((item, index) => (
            item.external ? (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                onClick={isMobile ? onClose : undefined}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  hoveredItem === index ? `bg-gradient-to-br ${item.gradient} shadow-lg` : "bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700"
                )}>
                  <item.icon className={cn("w-4 h-4", hoveredItem === index ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                </div>
                {!collapsed && (
                  <>
                    <span className="truncate text-sm font-medium flex-1">{item.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </a>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20" 
                    : "hover:bg-gray-100/80 dark:hover:bg-slate-800/80",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      isActive || hoveredItem === index 
                        ? `bg-gradient-to-br ${item.gradient} shadow-lg ${isActive ? 'shadow-violet-500/30' : ''}` 
                        : "bg-gray-100 dark:bg-slate-800"
                    )}>
                      <item.icon className={cn(
                        "w-4 h-4 transition-colors",
                        isActive || hoveredItem === index ? "text-white" : "text-gray-500 dark:text-gray-400"
                      )} />
                    </div>
                    {!collapsed && (
                      <>
                        <span className={cn(
                          "truncate text-sm font-medium flex-1",
                          isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-300"
                        )}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold uppercase">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isActive && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-8 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-r-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          ))}
        </div>

        {/* Payments Section */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Billing</p>
          )}
          {collapsed && <div className="h-px bg-gray-200 dark:bg-gray-800 mx-2 mb-2" />}
          
          <button
            onClick={() => !collapsed && setPaymentsOpen(!paymentsOpen)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
              paymentsOpen 
                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20" 
                : "hover:bg-gray-100/80 dark:hover:bg-slate-800/80",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Manage Payments" : undefined}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-200",
                paymentsOpen 
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30" 
                  : "bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700"
              )}>
                <Coins className={cn("w-4 h-4", paymentsOpen ? "text-white" : "text-gray-500 dark:text-gray-400")} />
              </div>
              {!collapsed && <span className={cn("text-sm font-medium", paymentsOpen ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-300")}>Payments</span>}
            </div>
            {!collapsed && (
              <motion.div animate={{ rotate: paymentsOpen ? 180 : 0 }}>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.div>
            )}
          </button>
          
          <AnimatePresence>
            {paymentsOpen && !collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 py-1 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  {paymentSubItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={isMobile ? onClose : undefined}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        isActive 
                          ? "bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium" 
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Support */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Support</p>
          )}
          {collapsed && <div className="h-px bg-gray-200 dark:bg-gray-800 mx-2 mb-2" />}
          
          {[
            { icon: Ticket, label: 'Support', path: '/support-tickets', gradient: 'from-cyan-500 to-blue-500' },
            { icon: Settings, label: 'Settings', path: '/settings', gradient: 'from-gray-500 to-slate-500' }
          ].map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20" 
                  : "hover:bg-gray-100/80 dark:hover:bg-slate-800/80",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                      : "bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700"
                  )}>
                    <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                  </div>
                  {!collapsed && (
                    <span className={cn(
                      "truncate text-sm font-medium",
                      isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-300"
                    )}>
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-slate-900 dark:to-slate-800/50">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center flex-col" : "")}>
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-800 shadow-lg">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                {planBadge && (
                  <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-gradient-to-r", planBadge.color)}>
                    {planBadge.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          )}
          
          {!collapsed && (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/80 dark:hover:bg-slate-700"
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                <User className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        {collapsed && (
          <div className="flex flex-col gap-1 mt-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-8 rounded-lg text-gray-400 hover:text-gray-600"
              onClick={() => navigate('/profile')}
              title="Profile"
            >
              <User className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-8 rounded-lg text-gray-400 hover:text-red-500"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserSidebar;
