
const ROLES_KEY = 'munal_roles';

const DEFAULT_ROLES = [
  { 
    name: 'Admin', 
    permissions: ['edit_team', 'delete_team', 'add_member', 'remove_member', 'change_role', 'view_logs', 'manage_billing', 'edit_content', 'view_content'] 
  },
  { 
    name: 'Editor', 
    permissions: ['edit_content', 'view_content', 'view_logs'] 
  },
  { 
    name: 'Viewer', 
    permissions: ['view_content'] 
  }
];

const getRoles = () => {
  try {
    const stored = localStorage.getItem(ROLES_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
};

const saveRoles = (roles) => {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
};

export const roleService = {
  getAvailableRoles: () => {
    return getRoles();
  },

  createRole: (name, permissions) => {
    const roles = getRoles();
    if (roles.some(r => r.name === name)) {
      throw new Error("Role already exists");
    }
    const newRole = { name, permissions };
    roles.push(newRole);
    saveRoles(roles);
    return newRole;
  },

  updateRole: (oldName, newName, permissions) => {
    const roles = getRoles();
    const index = roles.findIndex(r => r.name === oldName);
    if (index === -1) throw new Error("Role not found");
    
    // Don't allow renaming default roles if you want strict control, but for now we'll allow editing permissions
    // We will preserve the name if it's a default one to avoid breaking logic that relies on 'Admin' string
    const isDefault = DEFAULT_ROLES.some(dr => dr.name === oldName);
    
    roles[index] = {
      name: isDefault ? oldName : newName,
      permissions
    };
    
    saveRoles(roles);
    return roles[index];
  },

  deleteRole: (name) => {
    if (DEFAULT_ROLES.some(dr => dr.name === name)) {
      throw new Error("Cannot delete default roles");
    }
    const roles = getRoles();
    const filtered = roles.filter(r => r.name !== name);
    saveRoles(filtered);
  },

  getRolePermissions: (roleName) => {
    const role = getRoles().find(r => r.name === roleName);
    return role ? role.permissions : [];
  }
};
