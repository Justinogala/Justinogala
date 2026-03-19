import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { 
    isAuthenticated, 
    loading, 
    isAdminAuthenticated, 
    adminLoading 
  } = useAuth();
  
  const location = useLocation();
  
  // Determine which loading state to check based on route type
  const isLoading = adminOnly ? adminLoading : loading;
  const isAuth = adminOnly ? isAdminAuthenticated : isAuthenticated;
  const redirectPath = adminOnly ? '/admin/login' : '/';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl">
             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Verifying access...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;