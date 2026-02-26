
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
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
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
