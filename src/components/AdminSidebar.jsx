import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CreditCard, Ticket, MessageSquare, LogOut,
  Settings, Zap, Key, Mic, ChevronDown, Coins, Tag, Receipt, Percent,
  CreditCard as Gateway, Shield, Search, ChevronLeft, ChevronRight, FileText,
  Activity, BarChart3, Lock, Cloud, Video, Building2, Clock, FileWarning, FileCheck2, ClipboardList,
  HeartPulse
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// NavItem Component - Moved outside to avoid nested component issues
const NavItem = ({ link, index, collapsed, onClose, hoveredItem, setHoveredItem }) => (
  <NavLink
    to={link.path}
    onClick={onClose}
    onMouseEnter={() => setHoveredItem(index)}
    onMouseLeave={() => setHoveredItem(null)}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
      isActive 
        ? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20" 
        : "hover:bg-white/50 dark:hover:bg-slate-800/50",
      collapsed && "justify-center px-2"
    )}
    title={collapsed ? link.label : undefined}
  >
    {({ isActive }) => (
      <>
        <div className={cn(
          "p-2 rounded-lg transition-all duration-200",
          isActive || hoveredItem === index 
            ? `bg-gradient-to-br ${link.gradient} shadow-lg ${isActive ? 'shadow-violet-500/30' : ''}` 
            : "bg-white/60 dark:bg-slate-800/60 group-hover:bg-white dark:group-hover:bg-slate-700"
        )}>
          <link.icon className={cn(
            "w-4 h-4 transition-colors",
            isActive || hoveredItem === index ? "text-white" : "text-gray-500 dark:text-gray-400"
          )} />
        </div>
        {!collapsed && (
          <span className={cn(
            "truncate text-sm font-medium flex-1",
            isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-300"
          )}>
            {link.label}
          </span>
        )}
        {isActive && (
          <motion.div 
            layoutId="adminActiveIndicator"
            className="absolute left-0 w-1 h-8 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-r-full"
          />
        )}
      </>
    )}
  </NavLink>
);

// SubNavItem Component - Moved outside
const SubNavItem = ({ link, onClose }) => (
  <NavLink
    to={link.path}
    onClick={onClose}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
      isActive 
        ? "bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium" 
        : "text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200"
    )}
  >
    <link.icon className="w-4 h-4" />
    <span>{link.label}</span>
  </NavLink>
);

const AdminSidebar = ({ onClose, isMobile }) => {
  const { logout, adminUser, isSuperAdmin, hasModuleAccess } = useAdminAuth();
  const { permissions } = usePermissions();
  const navigate = useNavigate();
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const toggleCollapse = () => {
    if (!isMobile) setCollapsed(!collapsed);
  };

  // ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        setSearchQuery('');
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleSearchNav = useCallback((path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
    if (onClose) onClose();
  }, [navigate, onClose]);

  // Check module-level access using the RBAC module_permissions
  const canAccessModule = (moduleKey) => {
    return hasModuleAccess(moduleKey);
  };

  const primaryLinks = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/admin/dashboard', 
      gradient: 'from-violet-500 to-indigo-500',
      moduleKey: 'dashboard'
    },
  ];

  // Management links with module keys
  const allManagementLinks = [
    { icon: Users, label: 'Users', path: '/admin/users', gradient: 'from-blue-500 to-cyan-500', moduleKey: 'users' },
    { icon: Building2, label: 'Organizations', path: '/admin/organizations', gradient: 'from-violet-500 to-purple-500', moduleKey: 'organizations' },
    { icon: Building2, label: 'Workspaces', path: '/admin/workspaces', gradient: 'from-indigo-500 to-violet-500', moduleKey: 'workspaces' },
    { icon: FileWarning, label: 'IR / SOR Reports', path: '/admin/reports', gradient: 'from-red-500 to-orange-500', moduleKey: 'reports' },
    { icon: FileCheck2, label: 'IR/SOR Templates', path: '/admin/ir-sor-templates', gradient: 'from-orange-500 to-amber-500', moduleKey: 'ir_sor_templates' },
    { icon: MessageSquare, label: 'Chat Moderation', path: '/admin/chat-moderation', gradient: 'from-emerald-500 to-green-500', moduleKey: 'chat_moderation' },
    { icon: Clock, label: 'Shifts', path: '/admin/shifts', gradient: 'from-orange-500 to-amber-500', moduleKey: 'shifts' },
    { icon: Ticket, label: 'Support Tickets', path: '/admin/support-tickets', gradient: 'from-pink-500 to-rose-500', moduleKey: 'support_tickets' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages', gradient: 'from-rose-500 to-red-500', moduleKey: 'messages' },
    { icon: MessageSquare, label: 'Broadcasts', path: '/admin/broadcasts', gradient: 'from-violet-500 to-purple-500', moduleKey: 'broadcasts' },
    { icon: FileCheck2, label: 'Approval Templates', path: '/admin/approval-templates', gradient: 'from-teal-500 to-emerald-500', moduleKey: 'approval_templates' },
    { icon: ClipboardList, label: 'Forms', path: '/admin/forms', gradient: 'from-indigo-500 to-blue-500', moduleKey: 'forms' },
  ];

  // Filter management links based on module permissions
  const managementLinks = allManagementLinks.filter(link => canAccessModule(link.moduleKey));

  const paymentSubLinks = [
    { icon: Gateway, label: 'Payment Gateways', path: '/admin/payment-gateways' },
    { icon: CreditCard, label: 'Plans', path: '/admin/plans' },
    { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
    { icon: Percent, label: 'Tax Rates', path: '/admin/tax-rates' },
    { icon: Receipt, label: 'Transactions', path: '/admin/transactions' },
  ];

  // Config links with module keys
  const allConfigLinks = [
    { icon: Activity, label: 'Monitoring', path: '/admin/monitoring', gradient: 'from-green-500 to-emerald-500', moduleKey: 'monitoring' },
    { icon: HeartPulse, label: 'Data Health', path: '/admin/data-health', gradient: 'from-rose-500 to-red-500', moduleKey: 'monitoring' },
    { icon: Lock, label: 'Security Policies', path: '/admin/security-policies', gradient: 'from-red-500 to-rose-500', moduleKey: 'security_policies' },
    { icon: BarChart3, label: 'Meeting Analytics', path: '/admin/meeting-analytics', gradient: 'from-blue-500 to-indigo-500', moduleKey: 'meeting_analytics' },
    { icon: Cloud, label: 'Cloud Storage', path: '/admin/cloud-storage', gradient: 'from-sky-500 to-blue-500', moduleKey: 'cloud_storage' },
    { icon: Video, label: 'Video Settings', path: '/admin/video-settings', gradient: 'from-fuchsia-500 to-pink-500', moduleKey: 'video_settings' },
    { icon: CreditCard, label: 'Stripe Settings', path: '/admin/stripe-settings', gradient: 'from-green-500 to-emerald-500', moduleKey: 'stripe_settings' },
    { icon: Video, label: 'Video History', path: '/admin/video-history', gradient: 'from-purple-500 to-fuchsia-500', moduleKey: 'video_history' },
    { icon: Key, label: 'API Settings', path: '/admin/api-settings', gradient: 'from-amber-500 to-orange-500', moduleKey: 'api_settings' },
    { icon: Mic, label: 'Transcription Settings', path: '/admin/transcription-settings', gradient: 'from-purple-500 to-violet-500', moduleKey: 'transcription_settings' },
    { icon: Zap, label: 'Integrations', path: '/admin/integrations', gradient: 'from-cyan-500 to-teal-500', moduleKey: 'integrations' },
    { icon: FileText, label: 'Audit Logs', path: '/admin/audit-logs', gradient: 'from-rose-500 to-pink-500', moduleKey: 'audit_logs' },
    { icon: Settings, label: 'Settings', path: '/admin/settings', gradient: 'from-slate-500 to-gray-500', moduleKey: 'general_settings' },
  ];

  // Filter config links based on module permissions
  const configLinks = allConfigLinks.filter(link => canAccessModule(link.moduleKey));

  // Check if user can see billing section
  const canSeeBilling = canAccessModule('billing');

  return (
    <motion.div 
      className={cn(
        "flex flex-col h-full bg-gradient-to-b from-slate-50/95 to-white/95 dark:from-slate-950/95 dark:to-slate-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 transition-all duration-300",
        isMobile ? "w-[280px] shadow-2xl" : collapsed ? "w-20" : "w-72"
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
            onClick={() => navigate('/admin/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Admin</span>
              <p className="text-[10px] text-gray-400 -mt-0.5">Control Center</p>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 cursor-pointer"
            onClick={() => navigate('/admin/dashboard')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-5 h-5" />
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

      {/* Search Bar */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div
            onClick={() => { setSearchOpen(true); setSearchQuery(''); }}
            className="flex items-center gap-2 px-3 py-2.5 bg-white/60 dark:bg-slate-800/60 rounded-xl text-gray-400 text-sm cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors group border border-gray-200/50 dark:border-gray-700/50"
            data-testid="admin-search-trigger"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1">Search admin...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-[10px] font-medium shadow-sm">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Search Command Palette */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[61] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              data-testid="admin-search-palette"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, settings, modules..."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
                  data-testid="admin-search-input"
                />
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-[10px] text-gray-400 font-medium">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[340px] overflow-y-auto py-2">
                {(() => {
                  const allLinks = [
                    ...primaryLinks.map(l => ({ ...l, section: 'Dashboard' })),
                    ...managementLinks.map(l => ({ ...l, section: 'Management' })),
                    ...(canSeeBilling ? paymentSubLinks.map(l => ({ ...l, gradient: 'from-amber-500 to-yellow-500', section: 'Billing' })) : []),
                    ...configLinks.map(l => ({ ...l, section: 'Configuration' })),
                  ];
                  const q = searchQuery.toLowerCase().trim();
                  const results = q
                    ? allLinks.filter(l => l.label.toLowerCase().includes(q) || l.section.toLowerCase().includes(q))
                    : allLinks;
                  
                  if (results.length === 0) {
                    return (
                      <div className="px-4 py-8 text-center text-sm text-gray-400" data-testid="admin-search-empty">
                        No results found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    );
                  }

                  let lastSection = '';
                  return results.map((link) => {
                    const showSection = link.section !== lastSection;
                    lastSection = link.section;
                    return (
                      <React.Fragment key={link.path}>
                        {showSection && (
                          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{link.section}</p>
                        )}
                        <button
                          onClick={() => handleSearchNav(link.path)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                          data-testid={`search-result-${link.path.replace(/\//g, '-')}`}
                        >
                          <div className={cn('p-1.5 rounded-lg bg-gradient-to-br', link.gradient || 'from-gray-400 to-gray-500')}>
                            <link.icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{link.label}</span>
                          <span className="ml-auto text-[10px] text-gray-300 dark:text-gray-600">{link.section}</span>
                        </button>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex-1 py-2 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        
        {/* Dashboard */}
        <div className="space-y-1">
          {primaryLinks.map((link, index) => (
            <NavItem 
              key={link.path} 
              link={link} 
              index={index} 
              collapsed={collapsed}
              onClose={onClose}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
            />
          ))}
        </div>

        {/* Management */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Management</p>
          )}
          {collapsed && <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-2 mb-2" />}
          {managementLinks.map((link, index) => (
            <NavItem 
              key={link.path} 
              link={link} 
              index={primaryLinks.length + index} 
              collapsed={collapsed}
              onClose={onClose}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
            />
          ))}
        </div>

        {/* Payments Section - Only show if user has billing view permission */}
        {canSeeBilling && (
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Billing</p>
          )}
          {collapsed && <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-2 mb-2" />}
          
          <button
            onClick={() => !collapsed && setPaymentsOpen(!paymentsOpen)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
              paymentsOpen 
                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20" 
                : "hover:bg-white/50 dark:hover:bg-slate-800/50",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Manage Payments" : undefined}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-200",
                paymentsOpen 
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30" 
                  : "bg-white/60 dark:bg-slate-800/60 group-hover:bg-white dark:group-hover:bg-slate-700"
              )}>
                <Coins className={cn("w-4 h-4", paymentsOpen ? "text-white" : "text-gray-500 dark:text-gray-400")} />
              </div>
              {!collapsed && (
                <span className={cn(
                  "text-sm font-medium",
                  paymentsOpen ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-300"
                )}>
                  Manage Payments
                </span>
              )}
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
                <div className="space-y-1 py-1 ml-4 pl-4 border-l-2 border-amber-200 dark:border-amber-700/50">
                  {paymentSubLinks.map((link) => (
                    <SubNavItem key={link.path} link={link} onClose={onClose} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {/* Configuration - Only show if user has any config permissions */}
        {configLinks.length > 0 && (
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Configuration</p>
          )}
          {collapsed && <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-2 mb-2" />}
          {configLinks.map((link, index) => (
            <NavItem 
              key={link.path} 
              link={link} 
              index={primaryLinks.length + managementLinks.length + index} 
              collapsed={collapsed}
              onClose={onClose}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
            />
          ))}
        </div>
        )}

        {/* Module Permissions - Super Admin Only */}
        {canAccessModule('module_permissions') && (
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Super Admin</p>
          )}
          {collapsed && <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mx-2 mb-2" />}
          <NavItem
            link={{ icon: Shield, label: 'Module Permissions', path: '/admin/module-permissions', gradient: 'from-red-600 to-rose-600' }}
            index={primaryLinks.length + managementLinks.length + configLinks.length}
            collapsed={collapsed}
            onClose={onClose}
            hoveredItem={hoveredItem}
            setHoveredItem={setHoveredItem}
          />
        </div>
        )}
      </div>

      {/* Admin Profile Footer */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-gray-50/80 to-gray-100/50 dark:from-slate-900/80 dark:to-slate-800/50 backdrop-blur-sm">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center flex-col" : "")}>
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-indigo-500/30 shadow-lg">
              <AvatarImage src={adminUser?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white font-bold text-sm">
                {(adminUser?.name || adminUser?.username || 'AD').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {adminUser?.name || adminUser?.username || 'Admin'}
                </p>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500">
                  {adminUser?.role || 'Admin'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {adminUser?.email || 'admin@munal.ai'}
              </p>
            </div>
          )}
          
          {!collapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
            className="w-full h-8 mt-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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

export default AdminSidebar;
