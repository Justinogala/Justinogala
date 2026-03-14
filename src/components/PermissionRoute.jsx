import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions, useHasPermission } from '@/contexts/PermissionContext';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Access Denied Page Component
 */
const AccessDeniedPage = ({ permission, requiredRoles, role }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-red-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Access Denied
      </h1>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        You don&apos;t have permission to access this page.
      </p>
      
      <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 mb-6 text-sm">
        {permission && (
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Required permission:</span>{' '}
            <code className="px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded">{permission}</code>
          </p>
        )}
        {requiredRoles && (
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Required role:</span>{' '}
            <code className="px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded">{requiredRoles.join(' or ')}</code>
          </p>
        )}
        <p className="text-gray-500 dark:text-gray-500 mt-2">
          <span className="font-medium">Your role:</span>{' '}
          <code className="px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded">{role}</code>
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
        <Button 
          onClick={() => window.location.href = '/admin'}
        >
          <Shield className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

/**
 * PermissionRoute - Wrapper for routes that require specific permissions
 * 
 * Usage:
 *   <PermissionRoute category="users" action="view">
 *     <AdminUsersPage />
 *   </PermissionRoute>
 */
export const PermissionRoute = ({ 
  category, 
  action, 
  children, 
  redirectTo = '/admin',
  showAccessDenied = true 
}) => {
  const hasAccess = useHasPermission(category, action);
  const { role } = usePermissions();
  const location = useLocation();

  if (!hasAccess) {
    if (showAccessDenied) {
      return <AccessDeniedPage permission={`${category}.${action}`} role={role} />;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

/**
 * RoleRoute - Wrapper for routes that require specific roles
 */
export const RoleRoute = ({ 
  roles, 
  children, 
  redirectTo = '/admin',
  showAccessDenied = true 
}) => {
  const { role } = usePermissions();
  const location = useLocation();

  if (!roles.includes(role)) {
    if (showAccessDenied) {
      return <AccessDeniedPage requiredRoles={roles} role={role} />;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

/**
 * AdminOnlyRoute - Shorthand for routes requiring Admin role
 */
export const AdminOnlyRoute = ({ children, ...props }) => (
  <RoleRoute roles={['Admin']} {...props}>
    {children}
  </RoleRoute>
);

/**
 * ManagerOrAdminRoute - Shorthand for routes requiring Manager or Admin role
 */
export const ManagerOrAdminRoute = ({ children, ...props }) => (
  <RoleRoute roles={['Admin', 'Manager']} {...props}>
    {children}
  </RoleRoute>
);

export { AccessDeniedPage };
export default PermissionRoute;
