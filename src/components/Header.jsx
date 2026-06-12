
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, X, ChevronDown, LogOut, Shield, Plus, Check,
  Mic, Video, Search, MessageSquare, Users, FileText, 
  BarChart, Calendar, Zap, LayoutGrid, Heart, Code, 
  Briefcase, GraduationCap, AudioLines, Clapperboard,
  PenLine, FileOutput, AlertTriangle, CreditCard,
  Clock, Headphones, LayoutDashboard, CircleDot,
  FolderOpen, Bell, CheckCircle, Phone, GitBranch,
  Building, Scale, Landmark, HeartPulse, BookOpen, Wallet, Download
} from 'lucide-react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';

// Search Components
import SearchInput from '@/components/search/SearchInput';
import SearchResultsDropdown from '@/components/search/SearchResultsDropdown';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { scrollY } = useScroll();
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef(null);
  const searchContainerRef = useRef(null);
  
  const { isAdminAuthenticated, adminUser, adminLogout, isAuthenticated } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace() || {};

  // Global Search Hook
  const {
    query,
    results,
    loading,
    isOpen: isSearchOpen,
    setIsOpen: setIsSearchOpen,
    handleSearchChange,
    clearSearch,
    recentSearches,
    addToHistory,
    clearHistory,
    setQuery
  } = useGlobalSearch();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsSticky(latest > 10);
    });
    return () => unsubscribe();
  }, [scrollY]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsSearchOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const navStructure = {
    'Features': [
      // Column 1: AI & Media
      { label: 'Overview', href: '/features', icon: LayoutGrid, col: 0 },
      { label: 'Text to Audio', href: '/text-to-audio', icon: AudioLines, col: 0, badge: 'NEW' },
      { label: 'Text to Video', href: '/text-to-video', icon: Clapperboard, col: 0, badge: 'NEW' },
      { label: 'AI Transcriptions', href: '/features/transcriptions', icon: FileText, col: 0 },
      { label: 'Quick Record', href: '/quick-record', icon: CircleDot, col: 0 },
      { label: 'Voice Chat', href: '/features/voice-chat', icon: Headphones, col: 0 },
      // Column 2: Communication
      { label: 'Messages', href: '/features/chat-messaging', icon: MessageSquare, col: 1 },
      { label: 'Video Calls', href: '/features/video-calls', icon: Phone, col: 1, badge: 'NEW' },
      { label: 'Meetings', href: '/features/meetings', icon: Video, col: 1 },
      { label: 'Calendar', href: '/features/calendar-integration', icon: Calendar, col: 1 },
      { label: 'Notifications', href: '/features/notifications', icon: Bell, col: 1 },
      { label: 'Search', href: '/features/search', icon: Search, col: 1 },
      // Column 3: Workspace & Docs
      { label: 'Workspaces', href: '/features/teams', icon: Users, col: 2 },
      { label: 'Shifts', href: '/features/shifts', icon: Clock, col: 2 },
      { label: 'File Management', href: '/features/file-management', icon: FolderOpen, col: 2 },
      { label: 'eSignature', href: '/features/esignature', icon: PenLine, col: 2, badge: 'NEW' },
      { label: 'Doc Conversion', href: '/features/esignature', icon: FileOutput, col: 2 },
      // Column 4: Admin & Reporting
      { label: 'Approvals', href: '/features/approvals', icon: CheckCircle, col: 3, badge: 'NEW' },
      { label: 'IR / SOR Reports', href: '/features/ir-sor', icon: AlertTriangle, col: 3 },
      { label: 'Analytics', href: '/features/analytics', icon: BarChart, col: 3 },
      { label: 'Dashboard', href: '/features/dashboard', icon: LayoutDashboard, col: 3 },
      { label: 'Billing', href: '/pricing', icon: CreditCard, col: 3 },
    ],
    'Use Cases': [
      // Column 0: By Team
      { label: 'Sales Teams', href: '/use-cases/sales', icon: Briefcase, col: 0 },
      { label: 'Customer Success', href: '/use-cases/customer-success', icon: Heart, col: 0 },
      { label: 'Product Teams', href: '/use-cases/product', icon: LayoutGrid, col: 0 },
      { label: 'Engineering', href: '/use-cases/engineering', icon: Code, col: 0 },
      { label: 'HR & Recruiting', href: '/use-cases/hr', icon: Users, col: 0 },
      // Column 1: By Industry
      { label: 'Healthcare', href: '/solutions/healthcare', icon: HeartPulse, col: 1, badge: 'NEW' },
      { label: 'Education', href: '/solutions/education', icon: BookOpen, col: 1, badge: 'NEW' },
      { label: 'Government', href: '/use-cases/government', icon: Landmark, col: 1, badge: 'NEW' },
      { label: 'Legal & Compliance', href: '/solutions/legal', icon: Scale, col: 1, badge: 'NEW' },
      { label: 'Finance', href: '/solutions/finance', icon: Wallet, col: 1, badge: 'NEW' },
    ],
    'Product': [
      { label: 'Pricing', href: '/pricing', icon: Zap },
      { label: 'Security', href: '/product/security', icon: Shield },
      { label: 'Roadmap', href: '/product/roadmap', icon: LayoutGrid },
      { label: 'Downloads', href: '/downloads/mobile-app', icon: Download },
    ],
  };

  if (isAdminAuthenticated) {
    return (
      <header className="sticky top-0 z-50 w-full bg-slate-900 border-b border-violet-500/20 text-white shadow-md h-16">
        <div className="container mx-auto px-4 flex items-center justify-between h-full">
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">Munal Admin</span>
          </Link>
          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-sm text-gray-300">
               {adminUser?.username || 'Admin'}
             </div>
             <Button onClick={handleAdminLogout} variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
               <LogOut className="w-4 h-4" />
             </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header 
      className={cn(
        "sticky top-0 z-[60] w-full transition-all duration-300",
        isSticky 
          ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-md border-b border-violet-100 dark:border-violet-900/30 py-2" 
          : "bg-transparent py-3 md:py-4",
        "min-h-[64px]"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full gap-2 md:gap-4" ref={navRef}>
        
        <div className="flex items-center gap-2 md:gap-8 shrink-0">
          <Link to="/" className="flex items-center space-x-2 shrink-0 z-[51] group touch-target">
            <motion.div 
              className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/40"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
              <span className="text-white font-bold text-lg">M</span>
            </motion.div>
            <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600 dark:from-violet-400 dark:to-purple-300 group-hover:from-violet-600 group-hover:to-purple-500 transition-all">
              Munal
            </span>
          </Link>

          {isAuthenticated && workspaces && (
            <div className="hidden md:block relative">
              {/* Workspace Selector Desktop */}
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 px-3 py-2 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-700 dark:text-gray-200"
                onClick={() => setActiveDropdown(activeDropdown === 'workspace' ? null : 'workspace')}
              >
                <div className="w-6 h-6 rounded bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-400">
                  {currentWorkspace ? currentWorkspace.name.substring(0, 1).toUpperCase() : 'W'}
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </Button>

              <AnimatePresence>
                {activeDropdown === 'workspace' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-800 rounded-xl shadow-xl shadow-violet-500/10 z-50 overflow-hidden"
                  >
                    {/* ... workspace content ... */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-violet-50/30 dark:bg-violet-900/10">
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400 px-2 pb-1">My Workspaces</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {workspaces.map(ws => (
                        <button
                          key={ws.id}
                          onClick={() => { switchWorkspace(ws.id); setActiveDropdown(null); }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-lg transition-colors",
                            ws.id === currentWorkspace?.id 
                              ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium border border-violet-100 dark:border-violet-800/50" 
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400"
                          )}
                        >
                          <span>{ws.name}</span>
                          {ws.id === currentWorkspace?.id && <Check className="w-4 h-4 text-violet-600" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Global Search - Hidden on small mobile, visible on desktop */}
        <div ref={searchContainerRef} className="hidden md:block relative max-w-md w-full mx-4 lg:mx-8">
          <SearchInput 
            value={query}
            onChange={handleSearchChange}
            onClear={clearSearch}
            loading={loading}
            onFocus={() => setIsSearchOpen(true)}
          />
          <AnimatePresence>
            {isSearchOpen && (
              <SearchResultsDropdown 
                query={query}
                results={results}
                recentSearches={recentSearches}
                onClose={() => setIsSearchOpen(false)}
                onSelectHistory={(term) => {
                  setQuery(term);
                  handleSearchChange({ target: { value: term } });
                }}
                onClearHistory={clearHistory}
                onAddToHistory={addToHistory}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 shrink-0">
          {!isAuthenticated && Object.entries(navStructure).map(([title, items]) => (
            <div key={title} className="relative" onMouseLeave={() => setActiveDropdown(null)}>
              <button
                onMouseEnter={() => setActiveDropdown(title)}
                onClick={() => setActiveDropdown(activeDropdown === title ? null : title)}
                className={cn(
                  "flex items-center space-x-1 text-sm font-semibold py-2 transition-colors touch-target",
                  activeDropdown === title ? "text-violet-600 dark:text-violet-400" : "text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-400"
                )}
              >
                <span>{title}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", activeDropdown === title && "rotate-180")} />
              </button>
              <AnimatePresence>
                {activeDropdown === title && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute top-full z-50",
                      title === 'Features' ? 'right-0' : title === 'Use Cases' ? 'left-0' : 'left-0'
                    )}
                  >
                    {/* Bridge gap */}
                    <div className="h-2" />
                    <div className={cn(
                      "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl",
                      title === 'Features' ? 'w-[700px] p-5' : title === 'Use Cases' ? 'w-[460px] p-5' : 'w-56 py-2'
                    )}>
                    {title === 'Features' ? (
                      <>
                        <div className="grid grid-cols-4 gap-x-5 gap-y-0">
                          {['AI & Media', 'Communication', 'Workspace & Docs', 'Admin & Reports'].map((colTitle, i) => (
                            <div key={colTitle}>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500 mb-2 px-2">{colTitle}</p>
                              {items.filter(item => item.col === i).map((item) => (
                                <Link
                                  key={item.href + item.label}
                                  to={item.href}
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 rounded-md transition-colors group"
                                >
                                  <item.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors shrink-0" />
                                  <span>{item.label}</span>
                                  {item.badge && <span className="text-[9px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-1 py-0.5 rounded leading-none">{item.badge}</span>}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-violet-100 dark:border-violet-800 flex items-center justify-between">
                          <p className="text-xs text-gray-400">Explore all 24+ features</p>
                          <Link to="/features" onClick={() => setActiveDropdown(null)} className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1">
                            View all features <ChevronDown className="w-3 h-3 -rotate-90" />
                          </Link>
                        </div>
                      </>
                    ) : title === 'Use Cases' ? (
                      <>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                          {['By Team', 'By Industry'].map((colTitle, i) => (
                            <div key={colTitle}>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500 mb-2 px-2">{colTitle}</p>
                              {items.filter(item => item.col === i).map((item) => (
                                <Link
                                  key={item.href + item.label}
                                  to={item.href}
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 rounded-md transition-colors group"
                                  data-testid={`usecase-menu-${item.label.toLowerCase().replace(/[\s&]+/g, '-')}`}
                                >
                                  <item.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors shrink-0" />
                                  <span>{item.label}</span>
                                  {item.badge && <span className="text-[9px] font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-1 py-0.5 rounded leading-none">{item.badge}</span>}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-violet-100 dark:border-violet-800 flex items-center justify-between">
                          <p className="text-xs text-gray-400">10 solutions for every team</p>
                          <Link to="/use-cases" onClick={() => setActiveDropdown(null)} className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1">
                            View all use cases <ChevronDown className="w-3 h-3 -rotate-90" />
                          </Link>
                        </div>
                      </>
                    ) : (
                      items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors border-l-2 border-transparent hover:border-violet-500"
                        >
                          {item.icon && <item.icon className="w-4 h-4" />}
                          {item.label}
                        </Link>
                      ))
                    )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {!isAuthenticated && (
            <Link 
              to="/contact" 
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-400 transition-colors touch-target"
            >
              Contact
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center space-x-4 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/ai-chat')} variant="outline" className="gap-1.5" data-testid="header-ai-chat-btn">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6V2H8"/><path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><path d="M2 12h2"/><path d="M9 11v2"/><path d="M15 11v2"/><path d="M20 12h2"/></svg>
                AI Chat
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="default" className="shadow-violet-500/20">
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-violet-600 dark:text-gray-200 dark:hover:text-violet-400 transition-colors">Log in</Link>
              <Button onClick={() => navigate('/signup')} variant="default" className="shadow-violet-500/20">
                Get Started
              </Button>
            </>
          )}
          <ThemeSwitcher />
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center lg:hidden gap-1 md:gap-2">
           <ThemeSwitcher />
           <button 
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
             className="p-2 text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors touch-target"
             aria-label="Toggle menu"
           >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 top-[64px] bg-white dark:bg-slate-900 z-50 lg:hidden overflow-y-auto border-t border-violet-100 dark:border-violet-900/30 pb-safe"
            >
              <div className="flex flex-col p-6 space-y-6">
                 {/* Mobile Search */}
                 <div className="relative mb-4">
                    <SearchInput 
                      value={query}
                      onChange={handleSearchChange}
                      onClear={clearSearch}
                      loading={loading}
                      onFocus={() => setIsSearchOpen(true)}
                    />
                     {/* Simplified results for mobile */}
                     {isSearchOpen && results.length > 0 && (
                       <div className="mt-2 bg-gray-50 dark:bg-slate-800 rounded-lg p-2 max-h-60 overflow-y-auto">
                         {results.map((result, idx) => (
                           <div key={idx} className="p-2 border-b border-gray-100 dark:border-gray-700 last:border-0" onClick={() => navigate(result.link)}>
                             {result.title}
                           </div>
                         ))}
                       </div>
                     )}
                 </div>

                 {!isAuthenticated && Object.entries(navStructure).map(([title, items]) => (
                    <div key={title} className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {items.map((item) => (
                           <Link 
                              key={item.href}
                              onClick={() => setMobileMenuOpen(false)} 
                              to={item.href} 
                              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 active:bg-violet-50 dark:active:bg-violet-900/20 text-base font-medium text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              {item.icon && <div className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm"><item.icon className="w-4 h-4 text-violet-600" /></div>}
                              {item.label}
                           </Link>
                        ))}
                      </div>
                    </div>
                 ))}

                 {isAuthenticated ? (
                   <div className="grid grid-cols-1 gap-3">
                     <Link onClick={() => setMobileMenuOpen(false)} to="/dashboard" className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl text-lg font-bold text-violet-900 dark:text-white flex items-center justify-between">
                       Dashboard <ChevronDown className="w-5 h-5 -rotate-90" />
                     </Link>
                     <Link onClick={() => setMobileMenuOpen(false)} to="/meetings" className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-lg font-medium text-gray-900 dark:text-white flex items-center justify-between">
                       Meetings <ChevronDown className="w-5 h-5 -rotate-90" />
                     </Link>
                   </div>
                 ) : (
                   <div className="pt-4 flex flex-col gap-3">
                     <Button onClick={() => navigate('/login')} className="w-full h-12 text-base" variant="outline">Log In</Button>
                     <Button onClick={() => navigate('/signup')} className="w-full h-12 text-base" variant="default">Get Started</Button>
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
