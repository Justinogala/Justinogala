import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, MessageSquare, Clock, ArrowLeft, 
  MoreHorizontal, Ban, CheckCircle, Trash2, UserMinus,
  RefreshCw, Mail, Shield, AlertTriangle, FileText,
  Calendar, TrendingUp, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/PageTransition';
import { format } from 'date-fns';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminWorkspaceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Action dialog
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', target: null });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Transfer ownership
  const [transferDialog, setTransferDialog] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');

  useEffect(() => {
    fetchWorkspaceDetails();
  }, [id]);

  const fetchWorkspaceDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/${id}`);
      const data = await res.json();
      
      if (data.success) {
        setWorkspace(data.workspace);
      } else {
        throw new Error(data.detail || 'Failed to load workspace');
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/${id}/members`);
      const data = await res.json();
      
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
  }, [activeTab]);

  const performWorkspaceAction = async (action) => {
    setActionLoading(true);
    try {
      const body = {
        action,
        reason: actionReason,
        ...(action === 'transfer_ownership' && { new_owner_id: newOwnerId })
      };
      
      const res = await fetch(`${API_URL}/api/admin/workspaces/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: data.message });
        fetchWorkspaceDetails();
        setActionDialog({ open: false, type: '', target: null });
        setTransferDialog(false);
        setActionReason('');
        setNewOwnerId('');
      } else {
        throw new Error(data.detail || 'Action failed');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const removeMember = async (userId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/workspaces/${id}/members/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'Member removed from workspace' });
        fetchMembers();
        fetchWorkspaceDetails();
        setActionDialog({ open: false, type: '', target: null });
      } else {
        throw new Error(data.detail || 'Failed to remove member');
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
      archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    };
    return styles[status] || styles.active;
  };

  const getRoleBadge = (role) => {
    const styles = {
      owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      member: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    };
    return styles[role] || styles.member;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </PageTransition>
    );
  }

  if (!workspace) {
    return (
      <PageTransition>
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Workspace Not Found</h2>
          <p className="text-gray-500 mb-4">The workspace you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Button onClick={() => navigate('/admin/workspaces')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspaces
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6" data-testid="admin-workspace-detail-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/workspaces')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
              style={{ backgroundColor: workspace.color || '#6366f1' }}
            >
              {workspace.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{workspace.name}</h1>
                <Badge className={getStatusBadge(workspace.status)}>
                  {workspace.status || 'active'}
                </Badge>
              </div>
              <p className="text-gray-500">{workspace.description || 'No description'}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Admin Actions
                <MoreHorizontal className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {workspace.status !== 'suspended' ? (
                <DropdownMenuItem 
                  onClick={() => setActionDialog({ open: true, type: 'suspend', target: workspace })}
                  className="text-orange-600"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend Workspace
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => setActionDialog({ open: true, type: 'unsuspend', target: workspace })}
                  className="text-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Unsuspend Workspace
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setTransferDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Transfer Ownership
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setActionDialog({ open: true, type: 'delete', target: workspace })}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Members</p>
                  <p className="text-xl font-bold">{workspace.stats?.member_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Messages (7d)</p>
                  <p className="text-xl font-bold">{workspace.stats?.recent_messages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Shifts (Month)</p>
                  <p className="text-xl font-bold">{workspace.stats?.shifts_this_month || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium">
                    {workspace.created_at 
                      ? format(new Date(workspace.created_at), 'MMM d, yyyy')
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="notes">Admin Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owner Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Workspace Owner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={workspace.owner?.avatar} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {getInitials(workspace.owner?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{workspace.owner?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{workspace.owner?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workspace Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Visibility</span>
                    <Badge variant="outline">{workspace.settings?.visibility || 'Private'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Join Approval</span>
                    <Badge variant="outline">
                      {workspace.settings?.require_approval ? 'Required' : 'Open'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chat Enabled</span>
                    <Badge variant="outline">
                      {workspace.settings?.chat_enabled !== false ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Suspension Info (if suspended) */}
              {workspace.status === 'suspended' && (
                <Card className="md:col-span-2 border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                      Workspace Suspended
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Suspended At</span>
                        <span className="font-medium">
                          {workspace.suspended_at 
                            ? format(new Date(workspace.suspended_at), 'PPpp')
                            : 'Unknown'
                          }
                        </span>
                      </div>
                      {workspace.suspension_reason && (
                        <div>
                          <span className="text-gray-600">Reason:</span>
                          <p className="mt-1 p-2 bg-white dark:bg-slate-800 rounded">
                            {workspace.suspension_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Workspace Members</CardTitle>
                <CardDescription>{members.length} members</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-indigo-100 text-indigo-700">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              {member.is_owner && (
                                <Badge className="bg-purple-100 text-purple-700">Owner</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-sm">
                            <p>{member.shift_count || 0} shifts</p>
                            <p className="text-gray-500">{member.message_count || 0} messages</p>
                          </div>
                          <Badge className={getRoleBadge(member.workspace_role)}>
                            {member.workspace_role}
                          </Badge>
                          {!member.is_owner && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setActionDialog({ open: true, type: 'remove_member', target: member })}
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Action History</CardTitle>
                <CardDescription>Recent administrative actions on this workspace</CardDescription>
              </CardHeader>
              <CardContent>
                {workspace.action_history?.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {workspace.action_history.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            <FileText className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{log.action}</span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            {log.details?.reason && (
                              <p className="text-sm text-gray-500 mt-1">Reason: {log.details.reason}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">By: {log.admin_id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No admin actions recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
                <CardDescription>Internal notes about this workspace</CardDescription>
              </CardHeader>
              <CardContent>
                {workspace.admin_notes?.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {workspace.admin_notes.map((note) => (
                        <div key={note.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')} by {note.admin_id}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No admin notes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Confirmation Dialog */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: '', target: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">
                {actionDialog.type === 'remove_member' ? 'Remove Member' : `${actionDialog.type} Workspace`}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.type === 'delete' && 'This action cannot be undone.'}
                {actionDialog.type === 'suspend' && 'This workspace will be temporarily disabled.'}
                {actionDialog.type === 'remove_member' && `Remove ${actionDialog.target?.name} from this workspace?`}
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
              <Button variant="outline" onClick={() => setActionDialog({ open: false, type: '', target: null })}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (actionDialog.type === 'remove_member') {
                    removeMember(actionDialog.target?.id);
                  } else {
                    performWorkspaceAction(actionDialog.type);
                  }
                }}
                disabled={actionLoading}
                variant={['delete', 'remove_member'].includes(actionDialog.type) ? 'destructive' : 'default'}
              >
                {actionLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Ownership Dialog */}
        <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Ownership</DialogTitle>
              <DialogDescription>
                Select a member to become the new workspace owner
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium">New Owner</label>
                <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspace.members?.filter(m => m.user_id !== workspace.owner_id).map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Reason (optional)</label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for ownership transfer..."
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => performWorkspaceAction('transfer_ownership')}
                disabled={actionLoading || !newOwnerId}
              >
                {actionLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Transfer Ownership
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default AdminWorkspaceDetailPage;
