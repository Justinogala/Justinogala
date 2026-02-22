
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, X, ChevronDown, LogOut, Shield, Plus, Check,
  Mic, Video, Search, MessageSquare, Users, FileText, 
  BarChart, Calendar, Zap, LayoutGrid, Heart, Code, 
  Briefcase, GraduationCap 
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
      { label: 'Overview', href: '/features/overview', icon: LayoutGrid },
      { label: 'Meetings', href: '/features/meetings', icon: Calendar },
      { label: 'Transcriptions', href: '/features/transcriptions', icon: FileText },
      { label: 'Video Conferencing', href: '/features/video-conferencing', icon: Video },
      { label: 'Search', href: '/features/search', icon: Search },
      { label: 'Chat & Messaging', href: '/features/chat-messaging', icon: MessageSquare },
      { label: 'Teams', href: '/features/teams', icon: Users },
      { label: 'File Management', href: '/features/file-management', icon: FileText },
      { label: 'Analytics', href: '/features/analytics', icon: BarChart },
      { label: 'Voice Chat', href: '/features/voice-chat', icon: Mic },
      { label: 'Calendar Integration', href: '/features/calendar-integration', icon: Calendar },
    ],
    'Use Cases': [
      { label: 'Overview', href: '/use-cases', icon: Zap },
      { label: 'Sales Teams', href: '/use-cases/sales', icon: Briefcase },
      { label: 'Customer Success', href: '/use-cases/customer-success', icon: Heart },
      { label: 'Product Teams', href: '/use-cases/product', icon: LayoutGrid },
      { label: 'Engineering', href: '/use-cases/engineering', icon: Code },
      { label: 'HR & Recruiting', href: '/use-cases/hr', icon: Users },
    ],
    'Product': [
      { label: 'Pricing', href: '/pricing', icon: Zap },
      { label: 'Security', href: '/product/security', icon: Shield },
      { label: 'Roadmap', href: '/product/roadmap', icon: LayoutGrid },
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
            <div key={title} className="relative group">
              <button
                onMouseEnter={() => setActiveDropdown(title)}
                className="flex items-center space-x-1 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-400 py-2 transition-colors touch-target"
              >
                <span>{title}</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              {/* Dropdown content */}
              <AnimatePresence>
                {activeDropdown === title && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className={cn(
                      "absolute top-full left-0 mt-2 bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-700 rounded-xl shadow-xl shadow-violet-500/10 py-2 z-40 overflow-hidden",
                      title === 'Features' ? 'w-64' : 'w-56'
                    )}
                  >
                    {items.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors border-l-2 border-transparent hover:border-violet-500"
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        {item.label}
                      </Link>
                    ))}
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
            <Button onClick={() => navigate('/dashboard')} variant="default" className="shadow-violet-500/20">
              Go to Dashboard
            </Button>
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
