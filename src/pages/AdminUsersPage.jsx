
import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUser, deleteUser, resetUserPassword, suspendUser, activateUser } from '@/services/adminService';
import AdminTable from '@/components/AdminTable';
import CreateUserModal from '@/components/CreateUserModal';
import EditUserModal from '@/components/EditUserModal';
import UserDetailsModal from '@/components/UserDetailsModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, UserPlus, Edit, Trash2, Shield, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers(filters, page, 10);
      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, filters]); // Reload when page or filters change

  const handleCreateUser = async (userData) => {
    await createUser(userData);
    toast({ title: "Success", description: "User created successfully" });
    fetchUsers();
  };

  const handleUpdateUser = async (userId, updates) => {
    await updateUser(userId, updates);
    toast({ title: "Success", description: "User updated successfully" });
    fetchUsers();
  };

  const handleDeleteUser = async (user) => {
    if (confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone.`)) {
      await deleteUser(user.id);
      toast({ title: "Deleted", description: "User account has been permanently deleted" });
      fetchUsers();
    }
  };

  const handleResetPassword = async (userId) => {
    if (confirm("Reset user password? A temporary password will be generated.")) {
      const tempPass = await resetUserPassword(userId);
      alert(`New Temporary Password: ${tempPass}\n\nPlease copy this and share with the user.`);
    }
  };

  const handleStatusChange = async (user) => {
    if (user.status === 'active') {
      await suspendUser(user.id);
      toast({ title: "Suspended", description: "User account suspended" });
    } else {
      await activateUser(user.id);
      toast({ title: "Activated", description: "User account activated" });
    }
    fetchUsers();
  };

  const columns = [
    { key: 'name', label: 'User', render: (u) => (
      <div className="flex flex-col">
        <span className="font-medium text-white">{u.name || 'Unnamed'}</span>
        <span className="text-xs text-gray-500">{u.email}</span>
      </div>
    )},
    { key: 'plan', label: 'Plan', render: (u) => <Badge className="capitalize">{u.plan}</Badge> },
    { key: 'status', label: 'Status', render: (u) => (
      <Badge status={u.status === 'active' ? 'completed' : 'failed'} className="capitalize">
        {u.status}
      </Badge>
    )},
    { key: 'transcriptionMinutes', label: 'Usage', render: (u) => `${u.transcriptionMinutes}m` },
    { key: 'created_at', label: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    { key: 'actions', label: '', render: (u) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => { setSelectedUser(u); setDetailsModalOpen(true); }}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelectedUser(u); setEditModalOpen(true); }}>
            <Edit className="mr-2 h-4 w-4" /> Edit User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleResetPassword(u.id)}>
            <Shield className="mr-2 h-4 w-4" /> Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            className={u.status === 'active' ? "text-yellow-400" : "text-green-400"}
            onClick={() => handleStatusChange(u)}
          >
            {u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-400" onClick={() => handleDeleteUser(u)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <AdminTable 
        columns={columns} 
        data={users}
        isLoading={loading}
        onSearch={(val) => setFilters({...filters, search: val})}
        pagination={{ page, totalPages }}
        onPageChange={setPage}
      />

      <CreateUserModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onCreate={handleCreateUser} 
      />

      {selectedUser && (
        <>
          <EditUserModal 
            isOpen={editModalOpen} 
            onClose={() => setEditModalOpen(false)} 
            user={selectedUser}
            onUpdate={handleUpdateUser}
          />
          <UserDetailsModal 
            isOpen={detailsModalOpen} 
            onClose={() => setDetailsModalOpen(false)} 
            user={selectedUser}
            onEdit={() => { setDetailsModalOpen(false); setEditModalOpen(true); }}
            onResetPassword={() => handleResetPassword(selectedUser.id)}
          />
        </>
      )}
    </div>
  );
};

export default AdminUsersPage;
