import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/context/NotificationContext';
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
  Inbox, SendHorizontal, BarChart3, Bell, Link2, Paperclip, Video,
  Copy, TrendingDown, AlertTriangle, Zap, Activity, Mail, Settings,
  UserCheck, ArrowRightLeft, Sparkles, Users, Timer, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from 'recharts';

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
const ApprovalDetail = ({ approval, onBack, onRefresh, onDuplicate, user }) => {
  const { toast } = useToast();
  const [comments, setComments] = useState([]);
  const [audit, setAudit] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [detailTab, setDetailTab] = useState('details');
  // Delegation state
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [delegateSearch, setDelegateSearch] = useState('');
  const [delegateResults, setDelegateResults] = useState([]);
  const [selectedDelegate, setSelectedDelegate] = useState(null);
  const [delegateReason, setDelegateReason] = useState('');
  const [delegating, setDelegating] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

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

  const searchUsers = async (q) => {
    if (!q || q.length < 2) { setDelegateResults([]); return; }
    setSearchingUsers(true);
    try {
      const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        // Exclude current user from results
        setDelegateResults((data || []).filter(u => u.id !== user.id));
      }
    } catch { setDelegateResults([]); }
    finally { setSearchingUsers(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(delegateSearch), 300);
    return () => clearTimeout(timer);
  }, [delegateSearch]);

  const handleDelegate = async () => {
    if (!selectedDelegate) return;
    setDelegating(true);
    try {
      const res = await fetch(`${API_URL}/api/approvals/delegate/${approval.id}?user_id=${user.id}&user_name=${encodeURIComponent(user.name || user.email)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegate_to_id: selectedDelegate.id,
          delegate_to_name: selectedDelegate.name || selectedDelegate.email,
          delegate_to_email: selectedDelegate.email || '',
          reason: delegateReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Approval delegated', description: `Delegated to ${selectedDelegate.name || selectedDelegate.email}` });
        setShowDelegateModal(false);
        setSelectedDelegate(null);
        setDelegateReason('');
        setDelegateSearch('');
        onRefresh();
      } else {
        toast({ variant: 'destructive', title: 'Delegation failed', description: data.detail || 'Unknown error' });
      }
    } catch { toast({ variant: 'destructive', title: 'Delegation failed' }); }
    finally { setDelegating(false); }
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
  const isDelegatedTo = approval.steps?.some(s => s.delegated_to_id === user?.id && s.status === 'pending');
  const canAct = isApprover || isDelegatedTo;
  const isSender = approval.sender_id === user?.id;
  // Check if current user's step is already delegated
  const myStep = approval.steps?.find(s => s.approver_id === user?.id && s.status === 'pending');
  const alreadyDelegated = myStep?.delegated_to_id ? true : false;

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
      {canAct && approval.status === 'pending' && (
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => handleAction('approve')} disabled={!!actionLoading} className="bg-emerald-600 hover:bg-emerald-700" data-testid="approve-btn">
            {actionLoading === 'approve' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} Approve
          </Button>
          <Button onClick={() => handleAction('reject')} disabled={!!actionLoading} variant="destructive" data-testid="reject-btn">
            {actionLoading === 'reject' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />} Reject
          </Button>
          {isApprover && !alreadyDelegated && (
            <Button onClick={() => setShowDelegateModal(true)} variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" data-testid="delegate-btn">
              <ArrowRightLeft className="w-4 h-4 mr-1" /> Delegate
            </Button>
          )}
          {alreadyDelegated && (
            <Badge variant="outline" className="text-indigo-600 border-indigo-200 gap-1 py-1.5 px-3">
              <UserCheck className="w-3.5 h-3.5" /> Delegated to {myStep?.delegated_to_name}
            </Badge>
          )}
        </div>
      )}
      {isDelegatedTo && approval.status === 'pending' && !isApprover && (
        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 gap-1 py-1.5 px-3">
          <ArrowRightLeft className="w-3.5 h-3.5" /> Delegated to you by {approval.steps?.find(s => s.delegated_to_id === user?.id)?.delegated_by_name}
        </Badge>
      )}
      {isSender && approval.status === 'pending' && (
        <Button onClick={() => handleAction('cancel')} disabled={!!actionLoading} variant="outline" className="text-red-600">
          <X className="w-4 h-4 mr-1" /> Cancel Request
        </Button>
      )}

      {/* Duplicate button - available on any completed/cancelled request */}
      <Button variant="outline" size="sm" onClick={() => onDuplicate(approval)} data-testid="duplicate-btn">
        <Copy className="w-4 h-4 mr-1" /> Duplicate
      </Button>

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

              {/* Linked Items */}
              {(approval.linked_meeting || (approval.linked_files && approval.linked_files.length > 0)) && (
                <div className="border-t pt-4 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Linked Items</p>
                  {approval.linked_meeting && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Video className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{approval.linked_meeting.title}</span>
                    </div>
                  )}
                  {(approval.linked_files || []).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <Paperclip className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
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
                        {step.delegated_to_name && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
                            <span className="text-xs text-indigo-600 dark:text-indigo-400">
                              Delegated to {step.delegated_to_name}
                              {step.delegation_reason && <span className="text-slate-400"> — {step.delegation_reason}</span>}
                            </span>
                          </div>
                        )}
                        {step.acted_by_delegate && (
                          <p className="text-[11px] text-slate-400 mt-0.5">Acted by delegate: {step.delegate_actor_name}</p>
                        )}
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

      {/* Delegate Modal */}
      <Dialog open={showDelegateModal} onOpenChange={setShowDelegateModal}>
        <DialogContent className="max-w-md" data-testid="delegate-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" /> Delegate Approval
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500 mb-1">Search for a user to delegate to</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={delegateSearch}
                  onChange={e => setDelegateSearch(e.target.value)}
                  placeholder="Type name or email..."
                  className="pl-8"
                  data-testid="delegate-search-input"
                />
              </div>
              {searchingUsers && <p className="text-xs text-slate-400 mt-1">Searching...</p>}
              {delegateResults.length > 0 && !selectedDelegate && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto" data-testid="delegate-user-list">
                  {delegateResults.map(u => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/10 border-b last:border-0 transition-colors"
                      onClick={() => { setSelectedDelegate(u); setDelegateSearch(u.name || u.email); setDelegateResults([]); }}
                      data-testid={`delegate-user-${u.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name || 'No name'}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedDelegate && (
                <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800" data-testid="selected-delegate">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedDelegate.name || selectedDelegate.email}</span>
                  <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => { setSelectedDelegate(null); setDelegateSearch(''); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1">Reason (optional)</Label>
              <Textarea
                value={delegateReason}
                onChange={e => setDelegateReason(e.target.value)}
                placeholder="Why are you delegating this approval?"
                rows={2}
                data-testid="delegate-reason-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelegateModal(false)}>Cancel</Button>
            <Button
              onClick={handleDelegate}
              disabled={!selectedDelegate || delegating}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-testid="confirm-delegate-btn"
            >
              {delegating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-1" />}
              Delegate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const { createNotification } = useNotifications();
  const [title, setTitle] = useState(template ? template.name : '');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [workflowType, setWorkflowType] = useState('single');
  const [formData, setFormData] = useState({});
  const [approverName, setApproverName] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  // Integration state
  const [linkedMeeting, setLinkedMeeting] = useState(null);
  const [linkedFiles, setLinkedFiles] = useState([]);
  const [meetingSearch, setMeetingSearch] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [showMeetingPicker, setShowMeetingPicker] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [files, setFiles] = useState([]);

  const fields = template?.fields || [];

  // Fetch meetings for linking
  const fetchMeetings = async (q) => {
    try {
      const res = await fetch(`${API_URL}/api/meetings?user_id=${user.id}&search=${encodeURIComponent(q || '')}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || data || []);
      }
    } catch { setMeetings([]); }
  };

  // Fetch files for linking
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/files?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || data || []);
      }
    } catch { setFiles([]); }
  };

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
          linked_meeting: linkedMeeting,
          linked_files: linkedFiles,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Approval request created!' });
        // Fire in-app notification
        createNotification({
          type: 'system',
          title: 'Approval Sent',
          message: `Your request "${title}" has been sent for approval`,
          actionUrl: '/approvals',
          icon: 'FileCheck2',
          color: 'bg-violet-500',
        });
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

          {/* Linked Items (Meetings, Files) */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold">Linked Items</h3>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => { fetchMeetings(''); setShowMeetingPicker(true); }} data-testid="link-meeting-btn">
                <Video className="w-3.5 h-3.5 mr-1" /> Link Meeting
              </Button>
              <Button variant="outline" size="sm" onClick={() => { fetchFiles(); setShowFilePicker(true); }} data-testid="link-file-btn">
                <Paperclip className="w-3.5 h-3.5 mr-1" /> Attach File
              </Button>
            </div>

            {linkedMeeting && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Video className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-sm flex-1 truncate">{linkedMeeting.title}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setLinkedMeeting(null)}><X className="w-3 h-3" /></Button>
              </div>
            )}

            {linkedFiles.length > 0 && (
              <div className="space-y-1">
                {linkedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <Paperclip className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm flex-1 truncate">{f.name}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setLinkedFiles(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submitting} className="bg-violet-600 hover:bg-violet-700" data-testid="submit-approval-btn">
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Submit Request
        </Button>
      </div>

      {/* Meeting Picker Dialog */}
      <Dialog open={showMeetingPicker} onOpenChange={setShowMeetingPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Link a Meeting</DialogTitle></DialogHeader>
          <Input value={meetingSearch} onChange={e => { setMeetingSearch(e.target.value); fetchMeetings(e.target.value); }} placeholder="Search meetings..." data-testid="meeting-search" />
          <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
            {meetings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No meetings found</p>
            ) : meetings.slice(0, 20).map(m => (
              <div key={m.id || m._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => { setLinkedMeeting({ meeting_id: m.id || m._id, title: m.title || m.name || 'Meeting' }); setShowMeetingPicker(false); }}>
                <Video className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title || m.name || 'Untitled Meeting'}</p>
                  {m.date && <p className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* File Picker Dialog */}
      <Dialog open={showFilePicker} onOpenChange={setShowFilePicker}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Attach a File</DialogTitle></DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
            {files.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No files found</p>
            ) : files.slice(0, 30).map(f => (
              <div key={f.id || f._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => {
                const fileEntry = { file_id: f.id || f._id, name: f.name || f.filename || 'File', url: f.url || '' };
                if (!linkedFiles.some(lf => lf.file_id === fileEntry.file_id)) setLinkedFiles(prev => [...prev, fileEntry]);
                setShowFilePicker(false);
              }}>
                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name || f.filename || 'Untitled'}</p>
                  {f.size && <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ Analytics Dashboard ============
const AnalyticsDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/approvals/analytics?user_id=${user.id}`)
      .then(r => r.json()).then(setData).catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-400">Failed to load analytics</div>;

  const { summary, volume_trend, status_breakdown, category_breakdown, resolution_by_category, bottlenecks, insights } = data;

  const STATUS_COLORS = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', cancelled: '#94a3b8', expired: '#f97316', draft: '#cbd5e1' };
  const CATEGORY_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
  const SEVERITY_STYLES = {
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/15 dark:border-emerald-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/15 dark:border-amber-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/15 dark:border-blue-800',
  };
  const SEVERITY_ICON_COLORS = { success: 'text-emerald-600', warning: 'text-amber-600', info: 'text-blue-600' };

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: summary.total_requests, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/10' },
          { label: 'Approval Rate', value: `${summary.approval_rate}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
          { label: 'Avg Resolution', value: summary.avg_resolution_hours < 24 ? `${summary.avg_resolution_hours}h` : `${(summary.avg_resolution_hours / 24).toFixed(1)}d`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
          { label: 'Most Active', value: summary.most_active_category, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-violet-500" /> AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={cn('flex items-start gap-3 p-3 rounded-lg border', SEVERITY_STYLES[ins.severity] || SEVERITY_STYLES.info)} data-testid={`insight-${ins.type}`}>
                {ins.severity === 'warning' ? <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', SEVERITY_ICON_COLORS[ins.severity])} /> :
                 ins.severity === 'success' ? <CheckCircle2 className={cn('w-4 h-4 mt-0.5 shrink-0', SEVERITY_ICON_COLORS[ins.severity])} /> :
                 <Activity className={cn('w-4 h-4 mt-0.5 shrink-0', SEVERITY_ICON_COLORS[ins.severity])} />}
                <div>
                  <p className="text-sm font-semibold">{ins.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ins.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Request Volume (30 days)</CardTitle></CardHeader>
          <CardContent>
            <AreaChartComponent data={volume_trend} />
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <PieChartComponent data={status_breakdown} colors={STATUS_COLORS} nameKey="status" />
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Requests by Category</CardTitle></CardHeader>
          <CardContent>
            <BarChartComponent data={category_breakdown} dataKey="count" nameKey="category" colors={CATEGORY_COLORS} />
          </CardContent>
        </Card>

        {/* Resolution Time */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Resolution Time by Category</CardTitle></CardHeader>
          <CardContent>
            <BarChartComponent data={resolution_by_category} dataKey="avg_hours" nameKey="category" colors={CATEGORY_COLORS} label="Hours" />
          </CardContent>
        </Card>
      </div>

      {/* Bottlenecks */}
      {bottlenecks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Bottlenecks ({bottlenecks.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bottlenecks.map((b, i) => (
              <div key={i} className={cn('flex items-start gap-3 p-3 rounded-lg border', b.severity === 'high' ? 'bg-red-50 border-red-200 dark:bg-red-900/15 dark:border-red-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/15 dark:border-amber-800')} data-testid={`bottleneck-${b.type}`}>
                {b.type === 'slow_approver' ? <Clock className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />}
                <div>
                  <p className="text-sm font-medium">{b.message}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">{b.type === 'slow_approver' ? 'Slow Response' : 'Stuck Request'}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============ Chart Components (Recharts) ============

const AreaChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
      <Area type="monotone" dataKey="created" stroke="#8b5cf6" fill="url(#colorCreated)" strokeWidth={2} name="Created" />
      <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolved)" strokeWidth={2} name="Resolved" />
    </AreaChart>
  </ResponsiveContainer>
);

const PieChartComponent = ({ data, colors, nameKey }) => (
  <ResponsiveContainer width="100%" height={220}>
    <RPieChart>
      <Pie data={data} dataKey="count" nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
        {data.map((entry, i) => <Cell key={i} fill={colors[entry[nameKey]] || Object.values(colors)[i % Object.values(colors).length]} />)}
      </Pie>
      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
    </RPieChart>
  </ResponsiveContainer>
);

const BarChartComponent = ({ data, dataKey, nameKey, colors, label }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} />
      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
      <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} name={label || dataKey}>
        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);


// ============ Analytics Dashboard ============
const CHART_COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];

const ApprovalAnalytics = ({ userId }) => {
  const [data, setData] = useState(null);
  const [aiInsights, setAiInsights] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/approvals/analytics?user_id=${userId}`);
        if (res.ok) setData(await res.json());
      } catch { /* silent */ }
      finally { setLoadingData(false); }
    };
    fetchAnalytics();
  }, [userId]);

  const fetchAIInsights = async () => {
    setLoadingAI(true);
    try {
      const res = await fetch(`${API_URL}/api/approvals/ai-insights?user_id=${userId}`);
      if (res.ok) {
        const d = await res.json();
        setAiInsights(d.insights || 'No insights available.');
      }
    } catch { setAiInsights('Failed to generate insights.'); }
    finally { setLoadingAI(false); }
  };

  if (loadingData) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  if (!data) return <p className="text-center text-slate-400 py-12">No analytics data available.</p>;

  const { summary, by_category, by_priority, by_month, bottlenecks, delegation_stats } = data;

  return (
    <div className="space-y-6" data-testid="approval-analytics">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Approvals', value: summary.total, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Approval Rate', value: `${summary.approval_rate}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Avg Time', value: summary.avg_time_hours < 24 ? `${summary.avg_time_hours}h` : `${Math.round(summary.avg_time_hours / 24)}d`, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Delegation Rate', value: `${summary.delegation_rate}%`, icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map((card, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.bg)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
              <div>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Pending', value: summary.pending, color: 'bg-amber-500' },
          { label: 'Approved', value: summary.approved, color: 'bg-emerald-500' },
          { label: 'Rejected', value: summary.rejected, color: 'bg-red-500' },
          { label: 'Cancelled', value: summary.cancelled, color: 'bg-slate-400' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className={cn('w-2.5 h-2.5 rounded-full', s.color)} />
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className="text-sm font-bold ml-auto">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={by_month} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" /> By Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RPieChart>
                  <Pie data={by_category} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {by_category.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 py-16 text-sm">No category data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution + Delegation Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={by_priority} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                  {by_priority.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-purple-500" /> Delegation Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {[
              { label: 'Total Delegated', value: delegation_stats.total_delegated },
              { label: 'Acted by Delegate', value: delegation_stats.delegate_acted },
              { label: 'Delegation Rate', value: `${delegation_stats.delegation_rate}%` },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-sm text-slate-600 dark:text-slate-400">{s.label}</span>
                <span className="text-sm font-bold">{s.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck Detection */}
      {bottlenecks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" /> Approver Response Times
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {bottlenecks.map((b, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <p className="text-[11px] text-slate-400">{b.total_actions} actions &bull; {b.pending_count} pending</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", b.avg_response_hours > 48 ? "text-red-500" : b.avg_response_hours > 24 ? "text-amber-500" : "text-emerald-500")}>
                      {b.avg_response_hours < 24 ? `${b.avg_response_hours}h` : `${Math.round(b.avg_response_hours / 24)}d`}
                    </p>
                    <p className="text-[10px] text-slate-400">avg response</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-900/5 dark:to-purple-900/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" /> AI Insights
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">GPT-5.2</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchAIInsights} disabled={loadingAI} className="h-7 text-xs" data-testid="generate-ai-insights-btn">
              {loadingAI ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              {aiInsights ? 'Regenerate' : 'Generate Insights'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {!aiInsights && !loadingAI && (
            <p className="text-sm text-slate-400 py-6 text-center">Click &ldquo;Generate Insights&rdquo; to get AI-powered analysis of your approval workflows</p>
          )}
          {loadingAI && (
            <div className="flex items-center gap-2 py-6 justify-center text-indigo-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing approval patterns...</span>
            </div>
          )}
          {aiInsights && !loadingAI && (
            <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="ai-insights-content">
              {aiInsights.split('\n').map((line, i) => (
                <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-1">{line}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============ Main Approvals Page ============
const ApprovalsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();
  const [view, setView] = useState('dashboard'); // dashboard, detail, templates, create, analytics
  const [tab, setTab] = useState('received');
  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [approvalNotifs, setApprovalNotifs] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showDigestSettings, setShowDigestSettings] = useState(false);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestLoading, setDigestLoading] = useState(false);

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

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/approvals/notifications?user_id=${user.id}`);
      const data = await res.json();
      setApprovalNotifs(data.notifications || []);
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => { fetchApprovals(); fetchStats(); fetchNotifications(); }, [fetchApprovals, fetchStats, fetchNotifications]);

  // Fetch digest preference
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}/api/approvals/digest/preferences?user_id=${user.id}`)
      .then(r => r.json()).then(d => setDigestEnabled(d.enabled)).catch(() => {});
  }, [user?.id]);

  const toggleDigest = async () => {
    const newVal = !digestEnabled;
    setDigestEnabled(newVal);
    await fetch(`${API_URL}/api/approvals/digest/preferences?user_id=${user.id}&enabled=${newVal}`, { method: 'POST' });
    toast({ title: newVal ? 'Weekly digest enabled' : 'Weekly digest disabled' });
  };

  const sendTestDigest = async () => {
    setDigestLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/approvals/digest/trigger?user_id=${user.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const sent = data.results?.find(r => r.sent);
        toast({ title: sent ? 'Digest email sent!' : 'No activity to report — email skipped' });
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to send digest' }); }
    finally { setDigestLoading(false); }
  };

  const markNotifsRead = async () => {
    if (!user?.id) return;
    await fetch(`${API_URL}/api/approvals/notifications/read?user_id=${user.id}`, { method: 'POST' });
    setApprovalNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleExport = () => {
    window.open(`${API_URL}/api/approvals/export?user_id=${user?.id}&format=csv`, '_blank');
  };

  const handleDuplicate = async (approval) => {
    try {
      const res = await fetch(`${API_URL}/api/approvals/duplicate/${approval.id}?user_id=${user.id}&user_name=${encodeURIComponent(user.name || user.email)}&user_email=${encodeURIComponent(user.email || '')}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Request duplicated!' });
        createNotification({ type: 'system', title: 'Request Duplicated', message: `"${data.approval.title}" created as a copy`, actionUrl: '/approvals', icon: 'Copy', color: 'bg-violet-500' });
        setView('dashboard');
        setSelectedApproval(null);
        fetchApprovals();
        fetchStats();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to duplicate' }); }
  };

  if (view === 'analytics') {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('dashboard')} data-testid="back-from-analytics"><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics & Insights</h1>
            <p className="text-sm text-slate-500">AI-powered analytics for your approval workflows</p>
          </div>
        </div>
        <AnalyticsDashboard user={user} />
      </div>
    );
  }

  if (view === 'detail' && selectedApproval) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ApprovalDetail
          approval={selectedApproval}
          user={user}
          onBack={() => { setView('dashboard'); setSelectedApproval(null); }}
          onDuplicate={handleDuplicate}
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
          {/* Settings (Digest) */}
          <Button variant="outline" size="sm" onClick={() => setShowDigestSettings(true)} data-testid="digest-settings-btn">
            <Mail className="w-4 h-4" />
          </Button>
          {/* Notification Bell */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => { setShowNotifPanel(!showNotifPanel); if (!showNotifPanel) markNotifsRead(); }} data-testid="approval-notif-btn">
              <Bell className="w-4 h-4" />
              {approvalNotifs.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {approvalNotifs.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            {showNotifPanel && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border z-50 max-h-96 overflow-y-auto" data-testid="notif-panel">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold">Approval Notifications</p>
                </div>
                {approvalNotifs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">No notifications</div>
                ) : (
                  approvalNotifs.slice(0, 20).map(n => (
                    <div key={n.id} className={cn('px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors', !n.read && 'bg-violet-50/50 dark:bg-violet-900/10')} onClick={() => {
                      if (n.approval_id) {
                        const a = approvals.find(ap => ap.id === n.approval_id);
                        if (a) { setSelectedApproval(a); setView('detail'); }
                      }
                      setShowNotifPanel(false);
                    }}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="export-btn"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button variant="outline" size="sm" onClick={() => setView('analytics')} data-testid="analytics-btn"><BarChart3 className="w-4 h-4 mr-1" /> Analytics</Button>
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
            <TabsTrigger value="delegated" data-testid="delegated-tab"><ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Delegated{stats.delegated_pending > 0 ? ` (${stats.delegated_pending})` : ''}</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab"><BarChart3 className="w-3.5 h-3.5 mr-1" /> Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab !== 'analytics' && (
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
        )}
      </div>

      {/* Table or Analytics */}
      {tab === 'analytics' ? (
        <ApprovalAnalytics userId={user?.id} />
      ) : (
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
                        <td className="px-4 py-3 font-medium max-w-[250px]">
                          <span className="truncate block">{a.title}</span>
                          {a.steps?.some(s => s.delegated_to_id) && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 mt-0.5">
                              <ArrowRightLeft className="w-2.5 h-2.5" /> Delegated
                            </span>
                          )}
                        </td>
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
      )}

      {/* Digest Settings Dialog */}
      <Dialog open={showDigestSettings} onOpenChange={setShowDigestSettings}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-4 h-4 text-violet-500" /> Weekly Digest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Receive a weekly email summary every Monday with your approval stats, bottleneck alerts, and trend insights.</p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium">Email Digest</p>
                <p className="text-xs text-slate-400">Sent every Monday at 9 AM UTC</p>
              </div>
              <button
                onClick={toggleDigest}
                className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', digestEnabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600')}
                data-testid="digest-toggle"
              >
                <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform', digestEnabled ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={sendTestDigest} disabled={digestLoading} data-testid="send-test-digest-btn">
              {digestLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Send Test Digest Now
            </Button>
            <a href={`${API_URL}/api/approvals/digest/preview?user_id=${user?.id}`} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-violet-500 hover:underline" data-testid="preview-digest-link">
              Preview digest email
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalsPage;
