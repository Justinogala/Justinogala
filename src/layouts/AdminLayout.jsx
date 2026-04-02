
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { useAdminAuth } from '@/context/AdminAuthContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { adminUser } = useAdminAuth();
  
  // Pass user with module_permissions directly — PermissionContext handles RBAC
  const userWithPermissions = adminUser ? {
    ...adminUser,
    role: adminUser.role || 'Admin'
  } : null;

  return (
    <PermissionProvider user={userWithPermissions}>
      <Helmet>
        <title>Admin Portal - Munal</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex font-sans transition-colors duration-200">
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed top-0 bottom-0 left-0 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out h-full
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <AdminSidebar onClose={() => setSidebarOpen(false)} isMobile={sidebarOpen} />
        </aside>
        
        {/* Main Content Area */}
        <div className="flex-1 lg:ml-72 min-w-0 flex flex-col min-h-screen transition-all duration-300">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden pb-safe">
            <div className="max-w-7xl mx-auto h-full">
               <Outlet />
            </div>

            {/* Page Footer */}
            <div className="max-w-7xl mx-auto mt-8" data-testid="admin-page-footer">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-50 via-violet-50/80 to-purple-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/40 border border-indigo-100/60 dark:border-indigo-800/30 px-6 py-8">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent dark:via-indigo-500/30" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-violet-200/30 to-transparent dark:from-violet-700/10 rounded-full blur-2xl" />
                <div className="absolute top-0 left-8 w-20 h-20 bg-gradient-to-br from-indigo-200/20 to-transparent dark:from-indigo-700/10 rounded-full blur-xl" />
                <div className="relative text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-300/50">
                      <span className="text-white text-[10px] font-bold">M</span>
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Admin Console</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">
                    Munal AI &middot; Control Center
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Link to="/admin/users" className="text-[11px] text-indigo-500/70 hover:text-indigo-600 dark:text-indigo-400/60 dark:hover:text-indigo-300 transition-colors font-medium">Users</Link>
                    <span className="w-1 h-1 rounded-full bg-indigo-300/60 dark:bg-indigo-600/40" />
                    <Link to="/admin/settings" className="text-[11px] text-indigo-500/70 hover:text-indigo-600 dark:text-indigo-400/60 dark:hover:text-indigo-300 transition-colors font-medium">Settings</Link>
                    <span className="w-1 h-1 rounded-full bg-indigo-300/60 dark:bg-indigo-600/40" />
                    <Link to="/admin/reports" className="text-[11px] text-indigo-500/70 hover:text-indigo-600 dark:text-indigo-400/60 dark:hover:text-indigo-300 transition-colors font-medium">Reports</Link>
                    <span className="w-1 h-1 rounded-full bg-indigo-300/60 dark:bg-indigo-600/40" />
                    <Link to="/admin/security-policies" className="text-[11px] text-indigo-500/70 hover:text-indigo-600 dark:text-indigo-400/60 dark:hover:text-indigo-300 transition-colors font-medium">Security</Link>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
};

export default AdminLayout;
