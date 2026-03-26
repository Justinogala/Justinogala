import React, { createContext, useContext, useMemo } from 'react';

// Permission context for role-based access control
const PermissionContext = createContext(null);

// Module-to-permission-category mapping
// Maps module_permissions keys → the PermissionContext category + actions they enable
const MODULE_TO_PERMISSIONS = {
  dashboard: { dashboard: { view: true, analytics: true } },
  users: { users: { view: true, create: true, edit: true, delete: true } },
  organizations: { users: { view: true } },
  workspaces: { workspaces: { view: true, manage: true, suspend: true, delete: true } },
  reports: { workspaces: { view: true } },
  ir_sor_templates: { workspaces: { view: true } },
  chat_moderation: { chat_moderation: { view: true, flag: true, delete: true, export: true } },
  shifts: { shifts: { view: true, manage: true, override: true, export: true } },
  support_tickets: { support: { view: true, respond: true } },
  messages: { messages: { view: true, send: true } },
  broadcasts: { messages: { broadcast: true } },
  approval_templates: { settings: { modify: true } },
  forms: { workspaces: { view: true } },
  billing: { billing: { view: true, manage: true, refunds: true } },
  monitoring: { settings: { view: true } },
  security_policies: { settings: { security: true } },
  meeting_analytics: { dashboard: { analytics: true } },
  cloud_storage: { settings: { modify: true } },
  video_settings: { settings: { modify: true } },
  stripe_settings: { billing: { manage: true } },
  video_history: { settings: { view: true } },
  api_settings: { settings: { modify: true } },
  transcription_settings: { settings: { modify: true } },
  integrations: { settings: { modify: true } },
  audit_logs: { settings: { view: true } },
  general_settings: { settings: { view: true, modify: true } },
  module_permissions: { settings: { modify: true } },
};

// All permission categories with all-false defaults
const EMPTY_PERMISSIONS = {
  dashboard: { view: false, analytics: false },
  users: { view: false, create: false, edit: false, delete: false },
  workspaces: { view: false, manage: false, suspend: false, delete: false },
  chat_moderation: { view: false, flag: false, delete: false, export: false },
  shifts: { view: false, manage: false, override: false, export: false },
  billing: { view: false, manage: false, refunds: false },
  settings: { view: false, modify: false, security: false },
  support: { view: false, respond: false },
  messages: { view: false, send: false, broadcast: false },
};

// Build action-level permissions from module-level permissions
function buildPermissionsFromModules(modulePerms) {
  // Deep clone empty permissions
  const result = JSON.parse(JSON.stringify(EMPTY_PERMISSIONS));

  if (!modulePerms || typeof modulePerms !== 'object') return result;

  for (const [moduleKey, enabled] of Object.entries(modulePerms)) {
    if (!enabled) continue;
    const mapping = MODULE_TO_PERMISSIONS[moduleKey];
    if (!mapping) continue;

    for (const [category, actions] of Object.entries(mapping)) {
      if (!result[category]) result[category] = {};
      for (const [action, val] of Object.entries(actions)) {
        if (val) result[category][action] = true;
      }
    }
  }

  return result;
}

export const PermissionProvider = ({ children, user }) => {
  const permissions = useMemo(() => {
    if (!user) return EMPTY_PERMISSIONS;

    const role = (user.role || '').toLowerCase().replace(' ', '_');

    // Super admin gets everything
    if (role === 'super_admin') {
      const all = JSON.parse(JSON.stringify(EMPTY_PERMISSIONS));
      for (const cat of Object.keys(all)) {
        for (const act of Object.keys(all[cat])) {
          all[cat][act] = true;
        }
      }
      return all;
    }

    // Build from module_permissions (server-provided)
    if (user.module_permissions && Object.keys(user.module_permissions).length > 0) {
      return buildPermissionsFromModules(user.module_permissions);
    }

    // Fallback: empty (deny all) for unknown roles
    return EMPTY_PERMISSIONS;
  }, [user]);

  const value = useMemo(() => ({
    permissions,
    role: user?.role || 'User',
    isSuperAdmin: (user?.role || '').toLowerCase().replace(' ', '_') === 'super_admin',
    isAdmin: ['Admin', 'Super_Admin'].includes(user?.role),
    isManager: user?.role === 'Manager',
    isAdminOrManager: ['Admin', 'Super_Admin', 'Manager'].includes(user?.role),
    modulePermissions: user?.module_permissions || {},
  }), [permissions, user?.role, user?.module_permissions]);

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
    return {
      permissions: EMPTY_PERMISSIONS,
      role: 'User',
      isSuperAdmin: false,
      isAdmin: false,
      isManager: false,
      isAdminOrManager: false,
      modulePermissions: {},
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

// Export for use elsewhere
export { EMPTY_PERMISSIONS as DEFAULT_PERMISSIONS };
