
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Mail, Trash2, Shield, CheckCircle2, 
  Clock, AlertCircle, Search, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { 
  getWorkspaceMembers, inviteMember, removeMember, 
  getInvitations, updateMemberRole, cancelInvitation 
} from '@/services/workspaceService';
import { useAuth } from '@/context/AuthContext';

const WorkspaceMemberManagement = ({ workspaceId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        getWorkspaceMembers(workspaceId),
        getInvitations(workspaceId)
      ]);
      setMembers(m);
      setInvitations(i);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
      return;
    }
    
    setInviteLoading(true);
    try {
      await inviteMember(workspaceId, inviteEmail, inviteRole, user.id);
      toast({ title: 'Invitation Sent', description: `Invite sent to ${inviteEmail}` });
      setInviteEmail('');
      setShowInviteForm(false);
      loadData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to send invite' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember(workspaceId, userId);
      toast({ title: 'Member Removed', description: 'User has been removed from workspace.' });
      loadData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove member' });
    }
  };

  const handleCancelInvite = async (invitationId) => {
    try {
      await cancelInvitation(invitationId);
      toast({ title: 'Invitation Cancelled' });
      loadData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel invitation' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateMemberRole(workspaceId, userId, newRole);
      toast({ title: 'Role Updated' });
      loadData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update role' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Members</h3>
          <p className="text-sm text-gray-500">Manage access and roles for your workspace.</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      {showInviteForm && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-in slide-in-from-top-2">
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Invite New Member</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder="colleague@company.com" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-slate-900/50">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {member.email ? member.email[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.email?.split('@')[0] || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500">{member.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select defaultValue={member.role} onValueChange={(val) => handleRoleChange(member.user_id, val)}>
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                   <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                     Active
                   </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleRemoveMember(member.user_id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {invitations.map((invite) => (
              <TableRow key={invite.id} className="bg-gray-50/30 dark:bg-slate-800/20">
                <TableCell className="flex items-center gap-3 opacity-70">
                  <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">{invite.email}</div>
                    <div className="text-xs text-gray-500">Invitation Sent</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{invite.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                    Pending
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500" onClick={() => handleCancelInvite(invite.id)}>
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WorkspaceMemberManagement;
