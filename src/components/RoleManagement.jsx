
import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { roleService } from '@/services/roleService';
import { permissionService } from '@/services/permissionService';

const AVAILABLE_PERMISSIONS = [
  { id: 'edit_team', label: 'Edit Team Details' },
  { id: 'delete_team', label: 'Delete Team' },
  { id: 'add_member', label: 'Add Members' },
  { id: 'remove_member', label: 'Remove Members' },
  { id: 'change_role', label: 'Change Roles' },
  { id: 'view_logs', label: 'View Activity Logs' },
  { id: 'manage_billing', label: 'Manage Billing' },
  { id: 'edit_content', label: 'Edit Content' },
  { id: 'view_content', label: 'View Content' },
];

const RoleManagement = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', permissions: [] });

  const fetchRoles = () => {
    setRoles(roleService.getAvailableRoles());
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', permissions: [] });
    setIsModalOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setFormData({ name: role.name, permissions: role.permissions });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    try {
      if (!formData.name.trim()) return;

      if (editingRole) {
        roleService.updateRole(editingRole.name, formData.name, formData.permissions);
        toast({ title: "Role Updated", description: `${formData.name} updated successfully.` });
      } else {
        roleService.createRole(formData.name, formData.permissions);
        toast({ title: "Role Created", description: `${formData.name} created successfully.` });
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleDelete = (roleName) => {
    if (confirm(`Delete role "${roleName}"?`)) {
      try {
        roleService.deleteRole(roleName);
        fetchRoles();
        toast({ title: "Role Deleted" });
      } catch (err) {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
    }
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  return (
    <Card className="rounded-xl shadow-lg border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          Roles & Permissions
        </CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Create Role
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.name} className="flex items-start justify-between p-4 rounded-lg border border-border bg-card/50">
              <div>
                <h4 className="font-semibold text-text-primary flex items-center gap-2">
                  {role.name}
                  {['Admin', 'Editor', 'Viewer'].includes(role.name) && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded">Default</span>
                  )}
                </h4>
                <div className="flex flex-wrap gap-1 mt-2">
                  {role.permissions.map(p => (
                    <span key={p} className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                {!['Admin', 'Editor', 'Viewer'].includes(role.name) && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(role.name)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? "Edit Role" : "Create Role"}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Role Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              disabled={editingRole && ['Admin', 'Editor', 'Viewer'].includes(editingRole.name)} // Disable rename for defaults
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Permissions</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 border border-border rounded-lg">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <div key={perm.id} className="flex items-center space-x-2">
                   <Checkbox 
                      id={`perm-${perm.id}`}
                      checked={formData.permissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                   />
                   <label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer select-none">
                     {perm.label}
                   </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Role</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default RoleManagement;
