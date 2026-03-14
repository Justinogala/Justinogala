import React, { createContext, useContext, useMemo } from 'react';

// Permission context for role-based access control
const PermissionContext = createContext(null);

// Default permissions for each role
const DEFAULT_PERMISSIONS = {
  Admin: {
    dashboard: { view: true, analytics: true },
    users: { view: true, create: true, edit: true, delete: true },
    workspaces: { view: true, manage: true, suspend: true, delete: true },
    chat_moderation: { view: true, flag: true, delete: true, export: true },
    shifts: { view: true, manage: true, override: true, export: true },
    billing: { view: true, manage: true, refunds: true },
    settings: { view: true, modify: true, security: true },
    support: { view: true, respond: true },
    messages: { view: true, send: true, broadcast: true }
  },
  Manager: {
    dashboard: { view: true, analytics: true },
    users: { view: true, create: false, edit: false, delete: false },
    workspaces: { view: true, manage: true, suspend: false, delete: false },
    chat_moderation: { view: true, flag: true, delete: false, export: false },
    shifts: { view: true, manage: true, override: false, export: true },
    billing: { view: true, manage: false, refunds: false },
    settings: { view: true, modify: false, security: false },
    support: { view: true, respond: true },
    messages: { view: true, send: true, broadcast: false }
  },
  User: {
    dashboard: { view: false, analytics: false },
    users: { view: false, create: false, edit: false, delete: false },
    workspaces: { view: false, manage: false, suspend: false, delete: false },
    chat_moderation: { view: false, flag: false, delete: false, export: false },
    shifts: { view: false, manage: false, override: false, export: false },
    billing: { view: false, manage: false, refunds: false },
    settings: { view: false, modify: false, security: false },
    support: { view: false, respond: false },
    messages: { view: false, send: false, broadcast: false }
  }
};

export const PermissionProvider = ({ children, user }) => {
  // Get user permissions or defaults based on role
  const permissions = useMemo(() => {
    if (!user) return DEFAULT_PERMISSIONS.User;
    // Check if user has custom permissions (non-empty object)
    const hasCustomPerms = user.permissions && Object.keys(user.permissions).length > 0;
    return hasCustomPerms ? user.permissions : (DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.User);
  }, [user]);

  const value = useMemo(() => ({
    permissions,
    role: user?.role || 'User',
    isAdmin: user?.role === 'Admin',
    isManager: user?.role === 'Manager',
    isAdminOrManager: ['Admin', 'Manager'].includes(user?.role),
  }), [permissions, user?.role]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to access permission context
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    // Return default User permissions if no provider
    return {
      permissions: DEFAULT_PERMISSIONS.User,
      role: 'User',
      isAdmin: false,
      isManager: false,
      isAdminOrManager: false,
    };
  }
  return context;
};

// Hook to check a specific permission
export const useHasPermission = (category, action) => {
  const { permissions } = usePermissions();
  return permissions?.[category]?.[action] || false;
};

// Hook to check multiple permissions (any)
export const useHasAnyPermission = (category, actions) => {
  const { permissions } = usePermissions();
  const categoryPerms = permissions?.[category] || {};
  return actions.some(action => categoryPerms[action]);
};

// Hook to check multiple permissions (all)
export const useHasAllPermissions = (category, actions) => {
  const { permissions } = usePermissions();
  const categoryPerms = permissions?.[category] || {};
  return actions.every(action => categoryPerms[action]);
};

// Utility function to check permission (non-hook version)
export const hasPermission = (permissions, category, action) => {
  return permissions?.[category]?.[action] || false;
};

// Higher-order component for permission-based rendering
export const withPermission = (WrappedComponent, category, action) => {
  return function PermissionWrapper(props) {
    const hasAccess = useHasPermission(category, action);
    
    if (!hasAccess) {
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Component for conditional rendering based on permission
export const RequirePermission = ({ 
  category, 
  action, 
  children, 
  fallback = null,
  showDisabled = false 
}) => {
  const hasAccess = useHasPermission(category, action);
  
  if (!hasAccess) {
    if (showDisabled && React.isValidElement(children)) {
      return React.cloneElement(children, { disabled: true, className: `${children.props.className || ''} opacity-50 cursor-not-allowed` });
    }
    return fallback;
  }
  
  return children;
};

// Component for role-based rendering
export const RequireRole = ({ roles, children, fallback = null }) => {
  const { role } = usePermissions();
  
  if (!roles.includes(role)) {
    return fallback;
  }
  
  return children;
};

// Export default permissions for use elsewhere
export { DEFAULT_PERMISSIONS };
