import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, MessageSquare, Clock, Search, 
  MoreHorizontal, Eye, Ban, Trash2, RefreshCw, 
  TrendingUp, AlertTriangle, CheckCircle, Archive,
  ChevronLeft, ChevronRight, Filter, Wifi, WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

import { getApiUrl, API_URL } from '@/lib/api';

const REFRESH_INTERVAL = 20;

const AdminWorkspacesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Action dialog state
  const [actionDialog, setActionDialog] = useState({ open: false, workspace: null, action: '' });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Auto-refresh
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchWorkspaces();
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchWorkspaces();
    setLastUpdated(new Date());
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchWorkspaces();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { refreshAll(); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshAll]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const res = await fetch(`${API_URL}/api/admin/workspaces?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setWorkspaces(data.workspaces);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load workspaces' });
    } finally {
      setLoading(false);
    }
  };

  const performAction = async () => {
    if (!actionDialog.workspace || !actionDialog.action) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/workspaces/${actionDialog.workspace.id}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionDialog.action,
            reason: actionReason
          })
        }
      );
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        fetchWorkspaces();
        fetchStats();
        setActionDialog({ open: false, workspace: null, action: '' });
        setActionReason('');
      } else {
        throw new Error(data.detail || 'Action failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return styles[status] || styles.active;
  };

  const openActionDialog = (workspace, action) => {
    setActionDialog({ open: true, workspace, action });
    setActionReason('');
  };

  return (
    <PageTransition>
      <div className="p-6 space-y-6" data-testid="admin-workspaces-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-600" />
              Workspace Management
            </h1>
            <p className="text-gray-500 mt-1">Oversee and manage all workspaces across the platform</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">LIVE</span>
            </div>
            {lastUpdated && <span className="text-xs text-slate-400">{lastUpdated.toLocaleTimeString()}</span>}
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                autoRefresh ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500"
              )} data-testid="workspace-auto-refresh">
              {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {autoRefresh ? `${countdown}s` : 'Paused'}
            </button>
            <Button onClick={refreshAll} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Workspaces</p>
                    <p className="text-2xl font-bold">{stats.total_workspaces}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active_workspaces}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Suspended</p>
                    <p className="text-2xl font-bold text-red-600">{stats.suspended_workspaces}</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <Ban className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">New This Month</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.new_this_month}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search workspaces..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Workspaces Table */}
        <Card>
          <CardHeader>
            <CardTitle>Workspaces</CardTitle>
            <CardDescription>
              {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : workspaces.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No workspaces found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">Workspace</th>
                      <th className="pb-3 font-medium text-gray-500">Owner</th>
                      <th className="pb-3 font-medium text-gray-500 text-center">Members</th>
                      <th className="pb-3 font-medium text-gray-500 text-center">Messages</th>
                      <th className="pb-3 font-medium text-gray-500 text-center">Shifts</th>
                      <th className="pb-3 font-medium text-gray-500">Status</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {workspaces.map((ws) => (
                      <tr key={ws.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: ws.color || '#6366f1' }}
                            >
                              {ws.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{ws.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                {ws.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                                {ws.owner?.name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{ws.owner?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{ws.member_count}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span>{ws.message_count}</span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{ws.shift_count}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge className={getStatusBadge(ws.status)}>
                            {ws.status || 'active'}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/admin/workspaces/${ws.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {ws.status !== 'suspended' ? (
                                <DropdownMenuItem 
                                  onClick={() => openActionDialog(ws, 'suspend')}
                                  className="text-orange-600"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => openActionDialog(ws, 'unsuspend')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Unsuspend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => openActionDialog(ws, 'archive')}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openActionDialog(ws, 'delete')}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Confirmation Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, workspace: null, action: '' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">
                {actionDialog.action} Workspace
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {actionDialog.action} &quot;{actionDialog.workspace?.name}&quot;?
                {actionDialog.action === 'delete' && ' This action cannot be undone.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog({ open: false, workspace: null, action: '' })}>
                Cancel
              </Button>
              <Button
                onClick={performAction}
                disabled={actionLoading}
                variant={actionDialog.action === 'delete' ? 'destructive' : 'default'}
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm {actionDialog.action}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default AdminWorkspacesPage;
