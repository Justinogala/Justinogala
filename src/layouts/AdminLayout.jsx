
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
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200/60 dark:border-gray-800/60" />
                </div>
                <div className="relative flex justify-center">
                  <div className="px-4 py-1 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-full">
                    <div className="w-8 h-1 rounded-full bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 opacity-60" />
                  </div>
                </div>
              </div>
              <div className="text-center pt-6 pb-10">
                <p className="text-xs text-gray-400 dark:text-gray-500 tracking-wide">
                  Munal AI &middot; Admin Console
                </p>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <Link to="/admin/users" className="text-[11px] text-gray-400 hover:text-violet-500 dark:text-gray-500 dark:hover:text-violet-400 transition-colors">Users</Link>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <Link to="/admin/settings" className="text-[11px] text-gray-400 hover:text-violet-500 dark:text-gray-500 dark:hover:text-violet-400 transition-colors">Settings</Link>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <Link to="/admin/reports" className="text-[11px] text-gray-400 hover:text-violet-500 dark:text-gray-500 dark:hover:text-violet-400 transition-colors">Reports</Link>
                  <span className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <Link to="/admin/security-policies" className="text-[11px] text-gray-400 hover:text-violet-500 dark:text-gray-500 dark:hover:text-violet-400 transition-colors">Security</Link>
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
