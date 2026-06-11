import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  UserPlus, Download, FileJson, FileSpreadsheet, Loader2, Search, 
  Filter, Users, Shield, Mail, MoreHorizontal, Edit2, Trash2, 
  Eye, UserX, UserCheck, RefreshCw, Crown, Sparkles, MessageSquare,
  Building2, Link2, Unlink, Undo2, AlertTriangle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddUserModal from '@/components/admin/modals/AddUserModal';
import EditUserModal from '@/components/EditUserModal';
import UserMessagesModal from '@/components/admin/modals/UserMessagesModal';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserExportService } from '@/services/UserExportService';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { getApiUrl } from '@/lib/api';

const AdminUserManagementPage = () => {
  const { users, loading, addUser, updateUser, deleteUser, fetchUsers } = useUserManagement();
  const { isSuperAdmin } = useAdminAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Assign to Org state
  const [isAssignOrgOpen, setIsAssignOrgOpen] = useState(false);
  const [assignUser, setAssignUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedOrgRole, setSelectedOrgRole] = useState('member');
  const [assigningToOrg, setAssigningToOrg] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(false);

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('admin_token');

  // Trash state
  const [activeView, setActiveView] = useState('users'); // 'users' | 'trash'
  const [trashedUsers, setTrashedUsers] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashSearch, setTrashSearch] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState(null);

  const fetchTrashedUsers = useCallback(async () => {
    setTrashLoading(true);
    try {
      const searchParam = trashSearch ? `&search=${encodeURIComponent(trashSearch)}` : '';
      const res = await fetch(`${apiUrl}/api/admin/users/trash?limit=100${searchParam}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setTrashedUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch trashed users:', err);
    } finally {
      setTrashLoading(false);
    }
  }, [apiUrl, token, trashSearch]);

  useEffect(() => {
    if (activeView === 'trash') fetchTrashedUsers();
  }, [activeView, fetchTrashedUsers]);

  // Also fetch trash count on mount
  useEffect(() => { fetchTrashedUsers(); }, []);

  const handleRestoreUser = async (user) => {
    setRestoringId(user.id);
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${user.id}/restore`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast({ title: 'User restored', description: `${user.name || user.email} has been restored.` });
        fetchTrashedUsers();
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.detail || 'Failed to restore', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (user) => {
    if (!window.confirm(`PERMANENTLY delete ${user.name || user.email}? This cannot be undone.`)) return;
    setPermanentDeletingId(user.id);
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${user.id}/permanent`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast({ title: 'Permanently deleted', description: `${user.name || user.email} has been permanently removed.`, variant: 'destructive' });
        fetchTrashedUsers();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.detail || 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setPermanentDeletingId(null);
    }
  };

  const fetchOrganizations = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/organizations`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(Array.isArray(data) ? data : (data.organizations || []));
      }
    } catch (err) {
      console.error('Failed to fetch orgs:', err);
    } finally {
      setOrgsLoading(false);
    }
  }, [apiUrl, token]);

  const handleOpenAssignOrg = (user) => {
    setAssignUser(user);
    setSelectedOrgId('');
    setSelectedOrgRole('member');
    setIsAssignOrgOpen(true);
    fetchOrganizations();
  };

  const handleAssignToOrg = async () => {
    if (!selectedOrgId || !assignUser) return;
    setAssigningToOrg(true);
    try {
      const res = await fetch(`${apiUrl}/api/organizations/${selectedOrgId}/members/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ user_id: assignUser.id, org_role: selectedOrgRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'User assigned',
          description: `${assignUser.name || assignUser.email} assigned to ${data.org_name} as ${data.org_role}.`,
        });
        setIsAssignOrgOpen(false);
        setAssignUser(null);
        fetchUsers();
      } else {
        toast({ title: 'Error', description: data.detail || 'Failed to assign user', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    } finally {
      setAssigningToOrg(false);
    }
  };

  const handleRemoveFromOrg = async (user) => {
    if (!user.organization_id) return;
    if (!window.confirm(`Remove ${user.name || user.email} from their organization? They will become a personal account.`)) return;
    try {
      const res = await fetch(`${apiUrl}/api/organizations/${user.organization_id}/members/${user.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast({ title: 'User removed', description: `${user.name || user.email} removed from organization.` });
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.detail || 'Failed', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  };

  // Apply filters using useMemo
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let result = [...users];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(user => 
        (user.name && user.name.toLowerCase().includes(lowerTerm)) || 
        (user.full_name && user.full_name.toLowerCase().includes(lowerTerm)) ||
        (user.email && user.email.toLowerCase().includes(lowerTerm))
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter(user => (user.role || 'User').toLowerCase() === roleFilter.toLowerCase());
    }

    if (statusFilter !== 'all') {
      result = result.filter(user => (user.status || 'Active').toLowerCase() === statusFilter.toLowerCase());
    }

    if (planFilter !== 'all') {
      result = result.filter(user => (user.plan || 'Free') === planFilter);
    }

    return result;
  }, [searchTerm, roleFilter, statusFilter, planFilter, users]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
    toast({ title: "Users refreshed", description: "User list has been updated." });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPlanFilter('all');
  };

  const handleAddUser = async (userData) => {
    const success = await addUser(userData);
    if (success) {
      toast({ title: "User created", description: `${userData.name} has been added successfully.` });
      setIsAddUserModalOpen(false);
    }
    return success;
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    const currentStatus = user.status || 'Active';
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    await updateUser(user.id, { status: newStatus });
    toast({ 
      title: newStatus === 'Suspended' ? "User suspended" : "User activated",
      description: `${user.name || user.email} has been ${newStatus.toLowerCase()}.`
    });
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Move ${user.name || user.email} to trash? You can restore them later.`)) {
      await deleteUser(user.id);
      toast({ title: "Moved to trash", description: `${user.name || user.email} can be restored from the Trash tab.` });
    }
  };

  const handleChangeRole = async (user, newRole) => {
    await updateUser(user.id, { role: newRole });
    toast({
      title: "Role updated",
      description: `${user.name || user.email} is now ${newRole}. They must re-login to see changes.`,
    });
  };

  const handleExport = (format) => {
    if (filteredUsers.length === 0) {
      toast({ title: "Nothing to export", description: "No users match your filters.", variant: "destructive" });
      return;
    }
    if (format === 'csv') UserExportService.exportToCSV(filteredUsers);
    else UserExportService.exportToJSON(filteredUsers);
    toast({ title: "Export started", description: `Exporting ${filteredUsers.length} users...` });
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return 'N/A'; }
  };

  const getStatusColor = (status) => {
    switch ((status || 'Active').toLowerCase()) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'suspended': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'inactive': return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getRoleBadge = (role) => {
    switch ((role || 'User').toLowerCase()) {
      case 'admin': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case 'manager': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getPlanBadge = (plan) => {
    switch ((plan || 'Free').toLowerCase()) {
      case 'enterprise': return { color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white', icon: Crown };
      case 'pro': return { color: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white', icon: Sparkles };
      default: return { color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', icon: null };
    }
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const stats = [
    { label: 'Total Users', value: users?.length || 0, icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: 'Active', value: users?.filter(u => (u.status || 'Active') === 'Active').length || 0, icon: UserCheck, color: 'from-emerald-500 to-green-600' },
    { label: 'Suspended', value: users?.filter(u => u.status === 'Suspended').length || 0, icon: UserX, color: 'from-red-500 to-rose-600' },
    { label: 'In Trash', value: trashedUsers.length, icon: Trash2, color: 'from-gray-500 to-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950/50 p-4 sm:p-6 lg:p-8" data-testid="admin-user-management">
      <Helmet><title>User Management - Admin | Munal</title></Helmet>

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div className="max-w-7xl mx-auto space-y-6" variants={container} initial="hidden" animate="show">
        
        {/* Header */}
        <motion.div variants={item} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Manage users, roles, and permissions across your organization.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}><FileSpreadsheet className="w-4 h-4 mr-2" />CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}><FileJson className="w-4 h-4 mr-2" />JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsAddUserModalOpen(true)} size="sm" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25">
              <UserPlus className="w-4 h-4" /> Add User
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* View Toggle: Users / Trash */}
        <motion.div variants={item} className="flex gap-2">
          <Button
            variant={activeView === 'users' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('users')}
            className={activeView === 'users' ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
            data-testid="view-users-tab"
          >
            <Users className="w-4 h-4 mr-1.5" /> Users ({users?.length || 0})
          </Button>
          <Button
            variant={activeView === 'trash' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('trash')}
            className={activeView === 'trash' ? 'bg-slate-700 hover:bg-slate-800 text-white' : ''}
            data-testid="view-trash-tab"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Trash ({trashedUsers.length})
          </Button>
        </motion.div>

        {activeView === 'trash' ? (
          /* ========== TRASH VIEW ========== */
          <motion.div variants={item} className="space-y-4">
            {/* Trash Search */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search trashed users..."
                    value={trashSearch}
                    onChange={(e) => setTrashSearch(e.target.value)}
                    className="pl-9 bg-white dark:bg-slate-800"
                    data-testid="trash-search-input"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={fetchTrashedUsers} data-testid="refresh-trash-btn">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Trash List */}
            {trashLoading ? (
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-12 border border-gray-200/50 dark:border-gray-800/50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-slate-500 animate-spin mb-4" />
                <p className="text-gray-500">Loading trash...</p>
              </div>
            ) : trashedUsers.length === 0 ? (
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-12 border border-gray-200/50 dark:border-gray-800/50 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Trash is empty</h3>
                <p className="text-gray-500 text-sm">Deleted users will appear here for recovery.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trashedUsers.map((user, index) => {
                  const userName = user.name || user.full_name || user.email?.split('@')[0] || 'Unknown';
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 border border-red-200/50 dark:border-red-800/30 shadow-sm hover:shadow-md transition-all"
                      data-testid={`trash-user-${user.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-red-200 dark:border-red-900 shadow-sm opacity-60">
                          <AvatarImage src={user.avatar} alt={userName} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-400 to-gray-500 text-white font-semibold">
                            {getInitials(userName, user.email)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-600 dark:text-gray-300 truncate">{userName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                              Deleted
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3.5 h-3.5" /> {user.email}
                            </span>
                            {user.deleted_at && (
                              <span className="flex items-center gap-1 text-xs">
                                <Clock className="w-3 h-3" /> Deleted {formatDate(user.deleted_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRestoreUser(user)}
                            disabled={restoringId === user.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            data-testid={`restore-user-${user.id}`}
                          >
                            {restoringId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePermanentDelete(user)}
                            disabled={permanentDeletingId === user.id}
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5"
                            data-testid={`perm-delete-${user.id}`}
                          >
                            {permanentDeletingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* ========== USERS VIEW (existing) ========== */
          <>
        {/* Filters */}
        <motion.div variants={item} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name or email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] bg-white dark:bg-slate-800"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-white dark:bg-slate-800"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[130px] bg-white dark:bg-slate-800"><SelectValue placeholder="Plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || planFilter !== 'all') && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-gray-500">Clear</Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Users List */}
        <motion.div variants={item}>
          {loading && users.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-12 border border-gray-200/50 dark:border-gray-800/50 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-12 border border-gray-200/50 dark:border-gray-800/50 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No users found</h3>
              <p className="text-gray-500 text-sm max-w-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user, index) => {
                const userName = user.name || user.full_name || user.email?.split('@')[0] || 'Unknown';
                const planBadge = getPlanBadge(user.plan);
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md hover:border-violet-500/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 border-2 border-white dark:border-slate-800 shadow-sm">
                        <AvatarImage src={user.avatar} alt={userName} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
                          {getInitials(userName, user.email)}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{userName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                            {user.role || 'User'}
                          </span>
                          {planBadge.icon && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${planBadge.color}`}>
                              <planBadge.icon className="w-3 h-3" />
                              {user.plan}
                            </span>
                          )}
                          {user.account_type === 'business' ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center gap-1" data-testid={`user-business-badge-${index}`}>
                              <Building2 className="w-3 h-3" />
                              {user.org_role || 'Business'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700" data-testid={`user-personal-badge-${index}`}>
                              Personal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3.5 h-3.5" /> {user.email}
                          </span>
                          <span className="hidden sm:inline">Joined {formatDate(user.created_at || user.joined_date)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {user.status || 'Active'}
                      </span>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsMessagesModalOpen(true);
                          }}>
                            <MessageSquare className="w-4 h-4 mr-2" /> View Messages
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {(user.status || 'Active') === 'Active' ? (
                              <><UserX className="w-4 h-4 mr-2" /> Suspend User</>
                            ) : (
                              <><UserCheck className="w-4 h-4 mr-2" /> Activate User</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Change Role</div>
                          {['Admin', 'Manager', 'User'].filter(r => r !== (user.role || 'User')).map(role => (
                            <DropdownMenuItem key={role} onClick={() => handleChangeRole(user, role)} data-testid={`set-role-${role.toLowerCase()}-btn`}>
                              <Shield className="w-4 h-4 mr-2" /> Set as {role}
                            </DropdownMenuItem>
                          ))}
                          {isSuperAdmin() && (
                            <>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Organization</div>
                              {!user.organization_id ? (
                                <DropdownMenuItem onClick={() => handleOpenAssignOrg(user)} data-testid={`assign-org-btn-${user.id}`}>
                                  <Link2 className="w-4 h-4 mr-2" /> Assign to Organization
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleRemoveFromOrg(user)} data-testid={`remove-org-btn-${user.id}`}>
                                  <Unlink className="w-4 h-4 mr-2" /> Remove from Organization
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        {filteredUsers.length > 0 && (
          <motion.div variants={item} className="text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredUsers.length} of {users?.length || 0} users
          </motion.div>
        )}
          </>
        )}
      </motion.div>

      {/* Modals */}
      <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} onAddUser={handleAddUser} />
      <EditUserModal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} user={selectedUser} onUpdate={updateUser} />
      <UserMessagesModal 
        isOpen={isMessagesModalOpen} 
        onClose={() => {
          setIsMessagesModalOpen(false);
          setSelectedUser(null);
        }} 
        user={selectedUser} 
      />

      {/* Assign to Organization Dialog */}
      <Dialog open={isAssignOrgOpen} onOpenChange={setIsAssignOrgOpen}>
        <DialogContent className="sm:max-w-md" data-testid="assign-org-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-500" />
              Assign to Organization
            </DialogTitle>
            <DialogDescription>
              Assign <strong>{assignUser?.name || assignUser?.email}</strong> to an organization with a specific role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization</label>
              {orgsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading organizations...
                </div>
              ) : (
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="w-full" data-testid="org-select-trigger">
                    <SelectValue placeholder="Select an organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id} data-testid={`org-option-${org.id}`}>
                        {org.name}
                      </SelectItem>
                    ))}
                    {organizations.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-400">No organizations found</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization Role</label>
              <Select value={selectedOrgRole} onValueChange={setSelectedOrgRole}>
                <SelectTrigger className="w-full" data-testid="org-role-select-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                {selectedOrgRole === 'admin' && 'Admin — full access to organization features, platform role: Admin'}
                {selectedOrgRole === 'manager' && 'Manager — can manage teams and shifts, platform role: Manager'}
                {selectedOrgRole === 'member' && 'Member — standard access, platform role: User'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOrgOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignToOrg}
              disabled={!selectedOrgId || assigningToOrg}
              className="bg-violet-600 hover:bg-violet-700 text-white"
              data-testid="assign-org-confirm-btn"
            >
              {assigningToOrg ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagementPage;
