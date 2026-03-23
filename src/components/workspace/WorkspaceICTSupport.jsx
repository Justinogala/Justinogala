import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor, Plus, Clock, AlertTriangle, CheckCircle, ArrowRight,
  MessageSquare, Trash2, Loader2, User, ChevronDown, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';

const STATUS_CONFIG = {
  Open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', icon: Clock },
  'In Progress': { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: ArrowRight },
  Resolved: { color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400', icon: CheckCircle },
  Closed: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  Low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access/Permissions', 'Email', 'Printer', 'Phone/VoIP', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const IMPACTS = ['Individual', 'Team', 'Department', 'Organisation-wide'];

const WorkspaceICTSupport = ({ workspaceId, userId, userName, userRole }) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState('all');

  // Form state
  const [form, setForm] = useState({ title: '', category: '', priority: 'Medium', affected_system: '', description: '', impact: 'Individual' });

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error('Failed to fetch ICT requests:', e);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in title, category, and description.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, workspace_id: workspaceId, submitted_by_id: userId, submitted_by_name: userName }),
      });
      if (res.ok) {
        toast({ title: 'Request Submitted', description: 'Your ICT support ticket has been created.' });
        setShowForm(false);
        setForm({ title: '', category: '', priority: 'Medium', affected_system: '', description: '', impact: 'Individual' });
        fetchRequests();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to submit request.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests/${requestId}?user_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: 'Status Updated', description: `Ticket marked as ${newStatus}.` });
        fetchRequests();
        if (selectedRequest?.id === requestId) {
          const data = await res.json();
          setSelectedRequest(data.request);
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleComment = async (requestId) => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName, content: commentText }),
      });
      if (res.ok) {
        setCommentText('');
        // Refresh the selected request
        const detailRes = await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests/${requestId}?user_id=${userId}`);
        if (detailRes.ok) setSelectedRequest(await detailRes.json());
        fetchRequests();
      } else {
        const err = await res.json();
        toast({ title: 'Cannot Comment', description: err.detail || 'Failed to add comment.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add comment.', variant: 'destructive' });
    }
  };

  const handleDelete = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests/${requestId}?user_id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Deleted', description: 'ICT request removed.' });
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const openCount = requests.filter(r => r.status === 'Open').length;
  const inProgressCount = requests.filter(r => r.status === 'In Progress').length;

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} data-testid={`ict-filter-${f}`}
                className={filter === f ? 'bg-indigo-600 hover:bg-indigo-700' : ''}>
                {f === 'all' ? 'All' : f}
                {f === 'Open' && openCount > 0 && <Badge className="ml-1.5 bg-blue-500 text-white text-[10px] px-1.5">{openCount}</Badge>}
                {f === 'In Progress' && inProgressCount > 0 && <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5">{inProgressCount}</Badge>}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" data-testid="new-ict-request-btn">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Request List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Monitor className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No ICT Requests</h3>
            <p className="text-sm text-gray-500">Submit a support ticket to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const StatusIcon = STATUS_CONFIG[req.status]?.icon || Clock;
            return (
              <Card key={req.id} className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 dark:border-gray-800" onClick={() => setSelectedRequest(req)} data-testid={`ict-request-${req.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                    <StatusIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{req.title}</h4>
                      <Badge className={`text-[10px] px-2 ${PRIORITY_CONFIG[req.priority] || ''}`}>{req.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                      <span>{req.category}</span>
                      <span>by {req.submitted_by_name}</span>
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                      {req.comments?.length > 0 && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{req.comments.length}</span>}
                    </p>
                  </div>
                  <Badge className={`shrink-0 ${STATUS_CONFIG[req.status]?.color || ''}`}>{req.status}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New ICT Support Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input placeholder="Brief summary of the issue..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} data-testid="ict-title-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger data-testid="ict-category-select"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority *</label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger data-testid="ict-priority-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Affected System/Device</label>
              <Input placeholder="e.g. Laptop, VPN, SAP..." value={form.affected_system} onChange={e => setForm(p => ({ ...p, affected_system: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea placeholder="Describe the issue in detail..." rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} data-testid="ict-description-input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Business Impact</label>
              <Select value={form.impact} onValueChange={v => setForm(p => ({ ...p, impact: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{IMPACTS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700" data-testid="ict-submit-btn">
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={open => { if (!open) setSelectedRequest(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-lg">{selectedRequest.title}</DialogTitle>
                    <p className="text-xs text-gray-500 mt-1">Submitted by {selectedRequest.submitted_by_name} on {new Date(selectedRequest.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge className={STATUS_CONFIG[selectedRequest.status]?.color || ''}>{selectedRequest.status}</Badge>
                    <Badge className={PRIORITY_CONFIG[selectedRequest.priority] || ''}>{selectedRequest.priority}</Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-400 text-xs block mb-0.5">Category</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.category}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-400 text-xs block mb-0.5">Affected System</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.affected_system || 'N/A'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-400 text-xs block mb-0.5">Impact</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.impact}</span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-400 text-xs block mb-0.5">Assigned To</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.assigned_to_name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-lg p-3">{selectedRequest.description}</p>
                </div>

                {/* Resolution Notes */}
                {selectedRequest.resolution_notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Resolution Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-900">{selectedRequest.resolution_notes}</p>
                  </div>
                )}

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-wrap border-t pt-4">
                    <span className="text-sm font-medium text-gray-500 mr-1">Status:</span>
                    {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                      <Button key={s} size="sm" variant={selectedRequest.status === s ? 'default' : 'outline'} onClick={() => handleStatusChange(selectedRequest.id, s)}
                        className={selectedRequest.status === s ? 'bg-indigo-600' : ''} data-testid={`ict-status-${s}`}>
                        {s}
                      </Button>
                    ))}
                    <Button size="sm" variant="destructive" className="ml-auto" onClick={() => handleDelete(selectedRequest.id)} data-testid="ict-delete-btn">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                )}

                {/* Comments */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> Comments ({selectedRequest.comments?.length || 0})
                  </h4>
                  {selectedRequest.comments?.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {selectedRequest.comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-600">
                            {c.user_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.user_name}</span>
                              <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-4">No comments yet.</p>
                  )}

                  {/* Comment Input */}
                  {(isAdmin || ['Resolved', 'Closed'].includes(selectedRequest.status)) && (
                    <div className="flex gap-2">
                      <Input placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(selectedRequest.id); } }}
                        data-testid="ict-comment-input" />
                      <Button onClick={() => handleComment(selectedRequest.id)} disabled={!commentText.trim()} className="bg-indigo-600 hover:bg-indigo-700 shrink-0" data-testid="ict-comment-btn">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {!isAdmin && !['Resolved', 'Closed'].includes(selectedRequest.status) && (
                    <p className="text-xs text-gray-400 italic">Comments are enabled after the ticket is resolved.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspaceICTSupport;
