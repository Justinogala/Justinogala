import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Plus, Search, Filter, Download, ArrowLeft, Send, Clock, CheckCircle2,
  XCircle, AlertCircle, MoreHorizontal, MessageSquare, FileText, Loader2,
  ChevronRight, ClipboardList, Calendar, Banknote, Package, Plane, Home,
  CreditCard, ShoppingCart, Receipt, Wrench, FolderKanban, TrendingUp, X,
  Inbox, SendHorizontal, BarChart3
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: FileText },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: X },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
};

const PRIORITY_CONFIG = {
  Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ============ Approval Detail View ============
const ApprovalDetail = ({ approval, onBack, onRefresh, user }) => {
  const { toast } = useToast();
  const [comments, setComments] = useState([]);
  const [audit, setAudit] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [detailTab, setDetailTab] = useState('details');

  useEffect(() => {
    fetch(`${API_URL}/api/approvals/detail/${approval.id}`)
      .then(r => r.json()).then(d => {
        setComments(d.comments || []);
        setAudit(d.audit || []);
      }).catch(() => {});
  }, [approval.id]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      const res = await fetch(`${API_URL}/api/approvals/action/${approval.id}?user_id=${user.id}&user_name=${encodeURIComponent(user.name || user.email)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: '' }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `Request ${action}d successfully` });
        onRefresh();
      }
    } catch { toast({ variant: 'destructive', title: 'Action failed' }); }
    finally { setActionLoading(''); }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    const res = await fetch(`${API_URL}/api/approvals/comments/${approval.id}?user_id=${user.id}&user_name=${encodeURIComponent(user.name || user.email)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    const data = await res.json();
    if (data.success) {
      setComments(prev => [...prev, data.comment]);
      setNewComment('');
    }
  };

  const st = STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending;
  const StIcon = st.icon;
  const isApprover = approval.steps?.some(s => s.approver_id === user?.id && s.status === 'pending');
  const isSender = approval.sender_id === user?.id;

  return (
    <div className="space-y-5" data-testid="approval-detail">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="mt-1 shrink-0" data-testid="back-from-detail">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{approval.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span>by {approval.sender_name}</span>
              <span>&bull;</span>
              <span>{new Date(approval.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn('gap-1', st.color)}><StIcon className="w-3 h-3" />{st.label}</Badge>
          <Badge className={PRIORITY_CONFIG[approval.priority]}>{approval.priority}</Badge>
        </div>
      </div>

      {/* Action buttons */}
      {isApprover && approval.status === 'pending' && (
        <div className="flex gap-2">
          <Button onClick={() => handleAction('approve')} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700" data-testid="approve-btn">
            {actionLoading === 'approve' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} Approve
          </Button>
          <Button onClick={() => handleAction('reject')} disabled={!!actionLoading} variant="destructive" data-testid="reject-btn">
            {actionLoading === 'reject' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />} Reject
          </Button>
        </div>
      )}
      {isSender && approval.status === 'pending' && (
        <Button onClick={() => handleAction('cancel')} disabled={!!actionLoading} variant="outline" className="text-red-600">
          <X className="w-4 h-4 mr-1" /> Cancel Request
        </Button>
      )}

      {/* Tabs */}
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="workflow">Workflow ({approval.steps?.length || 0})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail ({audit.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {approval.description && <p className="text-sm text-slate-600 dark:text-slate-400">{approval.description}</p>}
              {Object.entries(approval.form_data || {}).map(([key, val]) => (
                <div key={key} className="flex gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm font-medium text-slate-500 w-40 capitalize shrink-0">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm">{String(val)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {(approval.steps || []).map((step, i) => {
                  const ss = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
                  const SSIcon = ss.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', step.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : step.status === 'rejected' ? 'bg-red-100 text-red-600' : step.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400')}>
                        {step.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : step.status === 'rejected' ? <XCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.approver_name || step.approver_email}</p>
                        <p className="text-xs text-slate-500">Step {step.step} &bull; {step.type}</p>
                      </div>
                      <Badge className={cn('text-xs', ss.color)}>{ss.label}</Badge>
                      {step.action_at && <span className="text-xs text-slate-400">{new Date(step.action_at).toLocaleDateString()}</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {comments.map(c => (
                <div key={c.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{c.user_name}</span>
                    <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1" onKeyDown={e => e.key === 'Enter' && addComment()} data-testid="comment-input" />
                <Button onClick={addComment} size="sm" data-testid="add-comment-btn"><Send className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {audit.map(a => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-sm"><span className="font-medium">{a.actor_name}</span> — {a.action}</p>
                      {a.details && <p className="text-xs text-slate-500">{a.details}</p>}
                      <p className="text-xs text-slate-400">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============ Template Store ============
const TemplateStore = ({ onSelect, onBack }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/approvals/templates`)
      .then(r => r.json()).then(d => {
        setTemplates(d.templates || []);
        setCategories(['All', ...(d.categories || [])]);
      }).catch(() => {});
  }, []);

  const filtered = templates.filter(t =>
    (selectedCat === 'All' || t.category === selectedCat) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = {};
  filtered.forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  return (
    <div className="space-y-5" data-testid="template-store">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Template Store</h2>
          <p className="text-sm text-slate-500">Choose a template to get started</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9" data-testid="template-search" />
        </div>
        <Select value={selectedCat} onValueChange={setSelectedCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {Object.entries(grouped).map(([cat, tmpls]) => (
        <div key={cat}>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">{cat}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tmpls.map(t => (
              <Card key={t.id} className="cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all group" onClick={() => onSelect(t)} data-testid={`template-${t.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold group-hover:text-violet-600 transition-colors">{t.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{t.fields?.length || 0} fields</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============ Create Approval Form ============
const CreateApprovalForm = ({ template, onBack, onCreated, user }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(template ? template.name : '');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [workflowType, setWorkflowType] = useState('single');
  const [formData, setFormData] = useState({});
  const [approverName, setApproverName] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fields = template?.fields || [];

  const addApprover = () => {
    if (!approverName.trim()) return;
    setApprovers(prev => [...prev, { user_id: `user-${Date.now()}`, name: approverName, email: approverEmail, type: 'individual' }]);
    setApproverName('');
    setApproverEmail('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast({ variant: 'destructive', title: 'Title is required' }); return; }
    if (approvers.length === 0) { toast({ variant: 'destructive', title: 'Add at least one approver' }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/approvals/create?user_id=${user.id}&user_name=${encodeURIComponent(user.name || user.email)}&user_email=${encodeURIComponent(user.email || '')}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, template_id: template?.id, category: template?.category || 'General',
          priority, approvers, form_data: formData, workflow_type: workflowType,
          description, deadline: null, attachments: [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Approval request created!' });
        onCreated();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to create request' }); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 max-w-3xl" data-testid="create-approval-form">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">{template ? `New: ${template.name}` : 'New Approval Request'}</h2>
          <p className="text-sm text-slate-500">{template?.category || 'Custom request'}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Request title" data-testid="approval-title-input" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="priority-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Workflow Type</Label>
              <Select value={workflowType} onValueChange={setWorkflowType}>
                <SelectTrigger data-testid="workflow-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Step</SelectItem>
                  <SelectItem value="sequential">Sequential (Multi-step)</SelectItem>
                  <SelectItem value="parallel">Parallel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your request..." rows={3} />
            </div>
          </div>

          {/* Template fields */}
          {fields.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Form Fields</h3>
              <div className="grid grid-cols-2 gap-4">
                {fields.map(f => (
                  <div key={f.name} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                    <Label>{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                    {f.type === 'textarea' ? (
                      <Textarea value={formData[f.name] || ''} onChange={e => setFormData(p => ({ ...p, [f.name]: e.target.value }))} placeholder={f.label} />
                    ) : f.type === 'select' ? (
                      <Select value={formData[f.name] || ''} onValueChange={v => setFormData(p => ({ ...p, [f.name]: v }))}>
                        <SelectTrigger><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                        <SelectContent>{(f.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} value={formData[f.name] || ''} onChange={e => setFormData(p => ({ ...p, [f.name]: e.target.value }))} placeholder={f.label} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approvers */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold">Approvers</h3>
            {approvers.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.name}</p>
                  {a.email && <p className="text-xs text-slate-400">{a.email}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setApprovers(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={approverName} onChange={e => setApproverName(e.target.value)} placeholder="Approver name" className="flex-1" data-testid="approver-name" />
              <Input value={approverEmail} onChange={e => setApproverEmail(e.target.value)} placeholder="Email (optional)" className="flex-1" />
              <Button variant="outline" size="sm" onClick={addApprover} data-testid="add-approver-btn"><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting} className="bg-violet-600 hover:bg-violet-700" data-testid="submit-approval-btn">
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Submit Request
        </Button>
      </div>
    </div>
  );
};

// ============ Main Approvals Page ============
const ApprovalsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState('dashboard'); // dashboard, detail, templates, create
  const [tab, setTab] = useState('received');
  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchApprovals = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ user_id: user.id, tab });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (search) params.append('search', search);
      const res = await fetch(`${API_URL}/api/approvals/list?${params}`);
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user?.id, tab, statusFilter, priorityFilter, search]);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/approvals/stats?user_id=${user.id}`);
      setStats(await res.json());
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => { fetchApprovals(); fetchStats(); }, [fetchApprovals, fetchStats]);

  const handleExport = () => {
    window.open(`${API_URL}/api/approvals/export?user_id=${user?.id}&format=csv`, '_blank');
  };

  if (view === 'detail' && selectedApproval) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ApprovalDetail
          approval={selectedApproval}
          user={user}
          onBack={() => { setView('dashboard'); setSelectedApproval(null); }}
          onRefresh={async () => {
            const res = await fetch(`${API_URL}/api/approvals/detail/${selectedApproval.id}`);
            const data = await res.json();
            setSelectedApproval(data.approval);
            fetchApprovals();
            fetchStats();
          }}
        />
      </div>
    );
  }

  if (view === 'templates') {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <TemplateStore
          onBack={() => setView('dashboard')}
          onSelect={(t) => { setSelectedTemplate(t); setView('create'); }}
        />
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <CreateApprovalForm
          template={selectedTemplate}
          user={user}
          onBack={() => { setView('dashboard'); setSelectedTemplate(null); }}
          onCreated={() => { setView('dashboard'); setSelectedTemplate(null); fetchApprovals(); fetchStats(); }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="approvals-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-sm text-slate-500">Manage your approval requests and workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="export-btn"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button size="sm" onClick={() => setView('templates')} className="bg-violet-600 hover:bg-violet-700" data-testid="new-approval-btn">
            <Plus className="w-4 h-4 mr-1" /> New Approval Request
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending (Received)', value: stats.received_pending || 0, icon: Inbox, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
          { label: 'Pending (Sent)', value: stats.sent_pending || 0, icon: SendHorizontal, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
          { label: 'Approved', value: stats.approved || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
          { label: 'Rejected', value: stats.rejected || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/10' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="received" data-testid="received-tab"><Inbox className="w-3.5 h-3.5 mr-1" /> Received</TabsTrigger>
            <TabsTrigger value="sent" data-testid="sent-tab"><SendHorizontal className="w-3.5 h-3.5 mr-1" /> Sent</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 w-44 h-9" data-testid="approval-search" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {['Low', 'Medium', 'High', 'Urgent'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No approvals found</p>
              <p className="text-xs mt-1">Create a new approval request to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900/50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">{tab === 'sent' ? 'Sent To' : 'Sent By'}</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map(a => {
                    const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                    const StIcon = st.icon;
                    return (
                      <tr key={a.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => { setSelectedApproval(a); setView('detail'); }} data-testid={`approval-row-${a.id}`}>
                        <td className="px-4 py-3"><Badge className={cn('text-xs', PRIORITY_CONFIG[a.priority])}>{a.priority}</Badge></td>
                        <td className="px-4 py-3 font-medium max-w-[250px] truncate">{a.title}</td>
                        <td className="px-4 py-3"><Badge className={cn('gap-1 text-xs', st.color)}><StIcon className="w-3 h-3" />{st.label}</Badge></td>
                        <td className="px-4 py-3 text-slate-500">{a.category}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-500">{tab === 'sent' ? (a.steps?.[0]?.approver_name || '—') : a.sender_name}</td>
                        <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalsPage;
