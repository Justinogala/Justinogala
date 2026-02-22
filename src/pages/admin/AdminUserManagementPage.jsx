
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { UserPlus, Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserSearchFilter from '@/components/admin/UserSearchFilter';
import UserManagementTable from '@/components/admin/UserManagementTable';
import AddUserModal from '@/components/admin/modals/AddUserModal';
import EditUserModal from '@/components/EditUserModal';
import UserDetailsModal from '@/components/UserDetailsModal';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserExportService } from '@/services/UserExportService';
import { billingUserSyncManager } from '@/utils/billingUserSyncManager';

const AdminUserManagementPage = () => {
  const { 
    users, 
    loading, 
    addUser, 
    updateUser, 
    deleteUser,
    fetchUsers 
  } = useUserManagement();
  
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const { toast } = useToast();

  // Initialize sync manager on mount
  useEffect(() => {
    billingUserSyncManager.init();
  }, []);

  // Apply filters whenever users or filter criteria change
  useEffect(() => {
    if (!users) return;
    
    let result = [...users];

    // Apply Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(user => 
        (user.name && user.name.toLowerCase().includes(lowerTerm)) || 
        (user.email && user.email.toLowerCase().includes(lowerTerm))
      );
    }

    // Apply Role Filter
    if (roleFilter !== 'all') {
      result = result.filter(user => (user.role || 'User').toLowerCase() === roleFilter.toLowerCase());
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(user => (user.status || 'Active').toLowerCase() === statusFilter.toLowerCase());
    }

    // Apply Plan Filter
    if (planFilter !== 'all') {
      result = result.filter(user => (user.plan || 'Free') === planFilter);
    }

    setFilteredUsers(result);
  }, [searchTerm, roleFilter, statusFilter, planFilter, users]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPlanFilter('all');
  };

  const handleUserAction = async (action, user) => {
    setSelectedUser(user);
    
    switch(action) {
      case 'view':
        setIsDetailsModalOpen(true);
        break;
      case 'edit':
        setIsEditUserModalOpen(true);
        break;
      case 'toggleStatus':
        const currentStatus = user.status || 'Active';
        const newStatus = (currentStatus === 'Active' || currentStatus === 'active') ? 'Suspended' : 'Active';
        const success = await updateUser(user.id, { status: newStatus });
        if (success && isDetailsModalOpen) {
          // If details modal is open, update selected user local state too to reflect instantly
          setSelectedUser(prev => ({ ...prev, status: newStatus }));
        }
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
          await deleteUser(user.id);
          setIsDetailsModalOpen(false);
        }
        break;
      default:
        break;
    }
  };

  const handleExport = (format) => {
    if (filteredUsers.length === 0) {
      toast({
        title: "Nothing to export",
        description: "There are no users matching your current filters.",
        variant: "destructive"
      });
      return;
    }

    if (format === 'csv') {
      UserExportService.exportToCSV(filteredUsers);
    } else {
      UserExportService.exportToJSON(filteredUsers);
    }

    toast({
      title: "Export Started",
      description: `Exporting ${filteredUsers.length} users to ${format.toUpperCase()}...`,
      variant: "success"
    });
  };

  // Custom add user handler to ensure billing sync
  const handleAddUser = async (userData) => {
    const success = await addUser(userData);
    if (success) {
      // Logic handled by billingUserSyncManager listening to events
      // But we can add UI feedback if needed
      toast({
        title: "Billing Synced",
        description: "Initial invoice generated automatically.",
        variant: "default" // Info
      });
      setIsAddUserModalOpen(false);
    }
    return success;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen pb-20">
      <Helmet>
        <title>User Management - Admin | Munal</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your users, roles, and account statuses.
          </p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer">
                <FileJson className="w-4 h-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={() => setIsAddUserModalOpen(true)}
            className="gap-2 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 text-white"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      <UserSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        planFilter={planFilter}
        onPlanFilterChange={setPlanFilter}
        onClearFilters={handleClearFilters}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : (
          <UserManagementTable 
            users={filteredUsers} 
            onAction={handleUserAction}
          />
        )}
      </motion.div>

      {/* Modals */}
      <AddUserModal 
        isOpen={isAddUserModalOpen} 
        onClose={() => setIsAddUserModalOpen(false)} 
        onAddUser={handleAddUser}
      />

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        user={selectedUser}
        onUpdate={updateUser}
      />

      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        user={selectedUser}
        onEdit={() => {
          setIsDetailsModalOpen(false);
          setIsEditUserModalOpen(true);
        }}
        onSuspend={(u) => handleUserAction('toggleStatus', u)}
        onDelete={(id) => {
          if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUser(id).then(() => setIsDetailsModalOpen(false));
          }
        }}
      />
    </div>
  );
};

export default AdminUserManagementPage;
