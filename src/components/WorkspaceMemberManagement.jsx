
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Mail, Trash2, Shield, CheckCircle2, 
  Clock, AlertCircle, Search, X, UserCheck
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
import { useAuth } from '@/context/AuthContext';

import { getApiUrl, API_URL } from '@/lib/api';

const WorkspaceMemberManagement = ({ workspaceId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addLoading, setAddLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`);
      if (!response.ok) throw new Error('Failed to load members');
      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load members' });
    } finally {
      setLoading(false);
    }
  };

  // Search users by email as they type
  const handleEmailSearch = async (email) => {
    setMemberEmail(email);
    if (email.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out already added members
        const memberIds = members.map(m => m.user_id);
        const filtered = (data.users || []).filter(u => !memberIds.includes(u.id) && u.id !== user?.id);
        setSearchResults(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (selectedUser = null) => {
    const emailToAdd = selectedUser?.email || memberEmail;
    
    if (!emailToAdd || !emailToAdd.includes('@')) {
      toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
      return;
    }
    
    setAddLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          email: emailToAdd,
          role: memberRole,
          added_by: user?.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add member');
      }
      
      toast({ 
        title: 'Member Added', 
        description: data.message || `${emailToAdd} has been added to the workspace`
      });
      setMemberEmail('');
      setSearchResults([]);
      setShowAddForm(false);
      loadMembers();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to add member' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove member');
      
      toast({ title: 'Member Removed', description: 'User has been removed from workspace.' });
      loadMembers();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove member' });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) throw new Error('Failed to update role');
      
      toast({ title: 'Role Updated' });
      loadMembers();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update role' });
    }
  };

  const selectUser = (selectedUser) => {
    setMemberEmail(selectedUser.email);
    setSearchResults([]);
    handleAddMember(selectedUser);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Members</h3>
          <p className="text-sm text-gray-500">Manage access and roles for your workspace.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {showAddForm && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-in slide-in-from-top-2">
          <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Add New Member</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input 
                placeholder="Search by email or name..." 
                value={memberEmail}
                onChange={(e) => handleEmailSearch(e.target.value)}
                className="bg-white dark:bg-slate-900"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => selectUser(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm">
                          {result.name?.[0]?.toUpperCase() || result.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {result.name || result.email.split('@')[0]}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{result.email}</div>
                      </div>
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Select value={memberRole} onValueChange={setMemberRole}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleAddMember()} disabled={addLoading || !memberEmail}>
              {addLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Members are added instantly without requiring approval.
          </p>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Loading members...
                  </div>
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  No members yet. Add your first team member above.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member, index) => (
                <TableRow key={member.id || index}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-indigo-100 text-indigo-600">
                        {member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {member.name || member.user?.name || member.email?.split('@')[0] || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">{member.email || member.user?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={member.role} 
                      onValueChange={(val) => handleRoleChange(member.user_id, val)}
                      disabled={member.role === 'owner'}
                    >
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
                    {member.role !== 'owner' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50" 
                        onClick={() => handleRemoveMember(member.user_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WorkspaceMemberManagement;
