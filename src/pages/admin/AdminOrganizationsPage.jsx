import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Building2, Plus, Users, Globe, Trash2, Edit2, UserPlus,
  Search, ChevronRight, Briefcase, ChevronLeft, Shield, Eye, Loader2, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOrganizationsPage = () => {
  const { admin } = useAdminAuth();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [orgStats, setOrgStats] = useState(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Create org form
  const [orgForm, setOrgForm] = useState({ name: '', domain: '', description: '' });
  // Add member form
  const [memberForm, setMemberForm] = useState({ name: '', email: '', password: '', role: 'member', org_role: 'User', plan: 'Free' });
  // Edit member form
  const [editMemberForm, setEditMemberForm] = useState({ name: '', email: '', org_role: '', plan: '', status: '' });

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/organizations`);
      const data = await res.json();
      setOrgs(data.organizations || []);
    } catch (err) {
      toast({ title: 'Failed to load organizations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const selectOrg = async (org) => {
    setSelectedOrg(org);
    try {
      const [membersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/organizations/${org.id}/members`),
        fetch(`${API_URL}/api/organizations/${org.id}/stats`)
      ]);
      const membersData = await membersRes.json();
      const statsData = await statsRes.json();
      setMembers(membersData.members || []);
      setOrgStats(statsData);
    } catch {
      toast({ title: 'Failed to load organization details', variant: 'destructive' });
    }
  };

  const handleCreateOrg = async () => {
    if (!orgForm.name.trim()) return toast({ title: 'Organization name is required', variant: 'destructive' });
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orgForm, created_by: admin?.id || 'admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      toast({ title: `Organization "${orgForm.name}" created` });
      setShowCreateOrg(false);
      setOrgForm({ name: '', domain: '', description: '' });
      fetchOrgs();
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOrg = async () => {
    if (!orgForm.name.trim()) return toast({ title: 'Organization name is required', variant: 'destructive' });
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations/${selectedOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      toast({ title: 'Organization updated' });
      setShowEditOrg(false);
      setSelectedOrg({ ...selectedOrg, ...orgForm });
      fetchOrgs();
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (!confirm('Delete this organization? Members will be converted to personal accounts.')) return;
    try {
      const res = await fetch(`${API_URL}/api/organizations/${orgId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast({ title: 'Organization deleted' });
      setSelectedOrg(null);
      fetchOrgs();
    } catch (err) {
      toast({ title: 'Failed to delete organization', variant: 'destructive' });
    }
  };

  const handleAddMember = async () => {
    if (!memberForm.name || !memberForm.email || !memberForm.password) {
      return toast({ title: 'Name, email, and password are required', variant: 'destructive' });
    }
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations/${selectedOrg.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      toast({ title: `Account created for ${memberForm.email}` });
      setShowAddMember(false);
      setMemberForm({ name: '', email: '', password: '', role: 'member', org_role: 'User', plan: 'Free' });
      selectOrg(selectedOrg);
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from this organization? They will become a personal account.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/organizations/${selectedOrg.id}/members/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast({ title: `${name} removed` });
      selectOrg(selectedOrg);
    } catch (err) {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
    }
  };

  const openEditMember = (member) => {
    setEditingMember(member);
    setEditMemberForm({
      name: member.name || '',
      email: member.email || '',
      org_role: member.org_role || 'member',
      plan: member.plan || 'Free',
      status: member.status || 'Active',
    });
    setShowEditMember(true);
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/organizations/${selectedOrg.id}/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMemberForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      toast({ title: `${editMemberForm.name} updated` });
      setShowEditMember(false);
      setEditingMember(null);
      selectOrg(selectedOrg);
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.domain || '').toLowerCase().includes(search.toLowerCase())
  );

  // ============= Detail View =============
  if (selectedOrg) {
    return (
      <div className="space-y-6" data-testid="org-detail-view">
        {/* Breadcrumb */}
        <button onClick={() => setSelectedOrg(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors" data-testid="org-back-btn">
          <ChevronLeft className="w-4 h-4" /> Back to Organizations
        </button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {selectedOrg.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="org-detail-name">{selectedOrg.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {selectedOrg.domain && (
                  <span className="text-sm text-slate-500 flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{selectedOrg.domain}</span>
                )}
                {selectedOrg.description && <span className="text-sm text-slate-400">{selectedOrg.description}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setOrgForm({ name: selectedOrg.name, domain: selectedOrg.domain || '', description: selectedOrg.description || '' }); setShowEditOrg(true); }} data-testid="org-edit-btn">
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteOrg(selectedOrg.id)} data-testid="org-delete-btn">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>

        {/* Stats */}
        {orgStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Members', value: orgStats.member_count, icon: Users, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
              { label: 'Active', value: orgStats.active_members, icon: Shield, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
              { label: 'Workspaces', value: orgStats.workspace_count, icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
              { label: 'Approvals', value: orgStats.approval_count, icon: BarChart3, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-xl p-4 ${stat.color} border border-transparent`} data-testid={`org-stat-${stat.label.toLowerCase()}`}>
                <stat.icon className="w-5 h-5 mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Members Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" /> Members ({members.length})
            </h2>
            <Button size="sm" onClick={() => setShowAddMember(true)} data-testid="org-add-member-btn" className="bg-violet-600 hover:bg-violet-700 text-white">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Create Account
            </Button>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-12" data-testid="org-no-members">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-3">No members yet</p>
              <Button size="sm" onClick={() => setShowAddMember(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Create First Account
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" data-testid={`org-member-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-medium">
                      {m.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px] px-2">
                      <Briefcase className="w-3 h-3 mr-1" />{m.org_role || m.role || 'member'}
                    </Badge>
                    <Badge className={`text-[10px] px-2 ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700'}`}>
                      {m.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-violet-600 hover:bg-violet-50" onClick={() => openEditMember(m)} data-testid={`org-edit-member-${i}`}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveMember(m.id, m.name)} data-testid={`org-remove-member-${i}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Org Dialog */}
        <Dialog open={showEditOrg} onOpenChange={setShowEditOrg}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Organization</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Organization Name" value={orgForm.name} onChange={e => setOrgForm(p => ({ ...p, name: e.target.value }))} data-testid="edit-org-name" />
              <Input placeholder="Domain (e.g. company.com)" value={orgForm.domain} onChange={e => setOrgForm(p => ({ ...p, domain: e.target.value }))} data-testid="edit-org-domain" />
              <Input placeholder="Description" value={orgForm.description} onChange={e => setOrgForm(p => ({ ...p, description: e.target.value }))} data-testid="edit-org-desc" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditOrg(false)}>Cancel</Button>
              <Button onClick={handleEditOrg} disabled={formLoading} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="edit-org-save">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Business Account</DialogTitle>
              <p className="text-xs text-slate-500 mt-1">Create a new user account under {selectedOrg.name}</p>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Full Name" value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} data-testid="add-member-name" />
              <Input placeholder={`Email (e.g. user@${selectedOrg.domain || 'company.com'})`} type="email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} data-testid="add-member-email" />
              <Input placeholder="Password" type="password" value={memberForm.password} onChange={e => setMemberForm(p => ({ ...p, password: e.target.value }))} data-testid="add-member-password" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Org Role</label>
                  <select className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))} data-testid="add-member-role">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Plan</label>
                  <select className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={memberForm.plan} onChange={e => setMemberForm(p => ({ ...p, plan: e.target.value }))} data-testid="add-member-plan">
                    <option value="Free">Free</option>
                    <option value="Business">Business</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
              <Button onClick={handleAddMember} disabled={formLoading} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="add-member-submit">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={showEditMember} onOpenChange={setShowEditMember}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Member Account</DialogTitle>
              <p className="text-xs text-slate-500 mt-1">Update account info for {editingMember?.name}</p>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name</label>
                <Input value={editMemberForm.name} onChange={e => setEditMemberForm(p => ({ ...p, name: e.target.value }))} data-testid="edit-member-name" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                <Input type="email" value={editMemberForm.email} onChange={e => setEditMemberForm(p => ({ ...p, email: e.target.value }))} data-testid="edit-member-email" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Org Role</label>
                  <select className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={editMemberForm.org_role} onChange={e => setEditMemberForm(p => ({ ...p, org_role: e.target.value }))} data-testid="edit-member-role">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Plan</label>
                  <select className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={editMemberForm.plan} onChange={e => setEditMemberForm(p => ({ ...p, plan: e.target.value }))} data-testid="edit-member-plan">
                    <option value="Free">Free</option>
                    <option value="Business">Business</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                  <select className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={editMemberForm.status} onChange={e => setEditMemberForm(p => ({ ...p, status: e.target.value }))} data-testid="edit-member-status">
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditMember(false)}>Cancel</Button>
              <Button onClick={handleEditMember} disabled={formLoading} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="edit-member-save">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============= List View =============
  return (
    <div className="space-y-6" data-testid="admin-organizations-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organizations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage business accounts and organization-level users</p>
        </div>
        <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="create-org-btn">
              <Plus className="w-4 h-4 mr-1.5" /> New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Organization</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Organization Name" value={orgForm.name} onChange={e => setOrgForm(p => ({ ...p, name: e.target.value }))} data-testid="create-org-name" />
              <Input placeholder="Domain (e.g. munal.com)" value={orgForm.domain} onChange={e => setOrgForm(p => ({ ...p, domain: e.target.value }))} data-testid="create-org-domain" />
              <Input placeholder="Description (optional)" value={orgForm.description} onChange={e => setOrgForm(p => ({ ...p, description: e.target.value }))} data-testid="create-org-desc" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateOrg(false)}>Cancel</Button>
              <Button onClick={handleCreateOrg} disabled={formLoading} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="create-org-submit">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Building2 className="w-4 h-4 mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search organizations..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="org-search" />
      </div>

      {/* Org List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" data-testid="org-empty">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No organizations yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first organization to manage business accounts</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((org, i) => (
              <motion.button
                key={org.id}
                onClick={() => selectOrg(org)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-left hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                data-testid={`org-card-${i}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {org.name.charAt(0)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white truncate">{org.name}</h3>
                {org.domain && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Globe className="w-3 h-3" />{org.domain}</p>
                )}
                {org.description && (
                  <p className="text-xs text-slate-400 mt-1 truncate">{org.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" /> {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    <Briefcase className="w-3 h-3 mr-0.5" /> Business
                  </Badge>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminOrganizationsPage;
