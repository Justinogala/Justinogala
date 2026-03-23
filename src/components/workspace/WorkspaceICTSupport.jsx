import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor, Plus, Clock, AlertTriangle, CheckCircle, ArrowRight,
  MessageSquare, Trash2, Loader2, User, Send, XCircle, Pause,
  ChevronDown, ChevronUp, MapPin, Mail, Phone, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';

// --- Config from Excel ---
const STATUS_CONFIG = {
  Open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', icon: Clock },
  Pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: Pause },
  Resolved: { color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400', icon: CheckCircle },
  Closed: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: CheckCircle },
  'Cancelled/Invalid': { color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: XCircle },
};

const PRIORITY_CONFIG = {
  Low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const ROLES = [
  'Administrative Staff', 'Program Manager', 'Floor Supervisor', 'Clinical Team',
  'Medical & Admin', 'Director', 'Finance', 'Behaviour Therapist', 'External Agency',
  'Junior Behaviour Associate', 'Location Supervisor', 'Recreation Associate',
  'Medical Admin Team', 'COP', 'Other',
];

const DEPARTMENTS = [
  'Administration', 'Clinical', 'Medical', 'Finance', 'IT/ICT', 'HR',
  'Operations', 'Programs', 'External', 'Other',
];

const REQUEST_TYPES = [
  'Email Password Reset',
  'ADP Password Reset',
  'ADP UserID Reset',
  'Email Account Update',
  'SharePoint Access or Update',
  'Multifactor Authentication',
  'Add/Delete Email from Distribution List',
  'Add Member to SharePoint Site',
  'Device/Hardware Issue',
  'Network/Connectivity Issue',
  'Software Issue',
  'Printer Issue',
  'Camera/Security System',
  'Phone/VoIP Issue',
  'Security Issue',
  'Talent LMS Access',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'Pending', 'Resolved', 'Closed', 'Cancelled/Invalid'];

const EMPTY_FORM = {
  reporter_role: '', department: '', reporting_for_self: 'Yes',
  other_user_name: '', other_user_email: '',
  request_type: '', location: '', description: '',
  device_equipment: '', who_is_affected: '', symptoms: '',
  error_messages: '', troubleshooting_attempted: 'No', troubleshooting_results: '',
  is_hr_related: 'No', hr_details: '', hr_email: '',
  contact_number: '', work_email: '', priority: 'Medium',
};

const SectionHeader = ({ label, sectionKey, icon: Icon, expanded, onToggle }) => (
  <button type="button" onClick={() => onToggle(sectionKey)}
    className="flex items-center justify-between w-full py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
    <span className="flex items-center gap-2">{Icon && <Icon className="w-4 h-4" />}{label}</span>
    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
  </button>
);

const WorkspaceICTSupport = ({ workspaceId, userId, userName, userRole }) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState('all');
  const [backendAdmin, setBackendAdmin] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [expandedSections, setExpandedSections] = useState({ reporter: true, request: true, details: false, hr: false, contact: false });

  const isAdmin = userRole === 'owner' || userRole === 'admin' || backendAdmin;

  const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        if (data.is_admin !== undefined) setBackendAdmin(data.is_admin);
      }
    } catch (e) {
      console.error('Failed to fetch ICT requests:', e);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSubmit = async () => {
    if (!form.request_type || !form.description.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in request type and description.', variant: 'destructive' });
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
        setForm({ ...EMPTY_FORM });
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

  const handleUpdateField = async (requestId, field, value) => {
    try {
      await fetch(`${API_URL}/api/workspaces/${workspaceId}/ict-requests/${requestId}?user_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (e) {
      console.error('Failed to update field:', e);
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
  const statusCounts = {};
  requests.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', ...STATUSES].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} data-testid={`ict-filter-${f}`}
              className={filter === f ? 'bg-indigo-600 hover:bg-indigo-700' : ''}>
              {f === 'all' ? 'All' : f}
              {f !== 'all' && statusCounts[f] > 0 && (
                <Badge className="ml-1.5 bg-white/20 text-white text-[10px] px-1.5">{statusCounts[f]}</Badge>
              )}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" data-testid="new-ict-request-btn">
          <Plus className="w-4 h-4" /> New Request
        </Button>
      </div>

      {/* Info Banner for non-admins */}
      {!isAdmin && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          <Shield className="w-4 h-4 shrink-0" />
          <span>You can only view your own submitted requests. ICT Support team can see all tickets.</span>
        </div>
      )}

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
                      <span className="text-xs font-mono text-gray-400">{req.ticket_number || '---'}</span>
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{req.request_type || req.title || 'Untitled'}</h4>
                      <Badge className={`text-[10px] px-2 ${PRIORITY_CONFIG[req.priority] || ''}`}>{req.priority}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 flex-wrap">
                      <span>{req.department || req.category || ''}</span>
                      <span>by {req.submitted_by_name}</span>
                      {req.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{req.location}</span>}
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

      {/* ===== New Request Dialog ===== */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New ICT Support Request</DialogTitle></DialogHeader>
          <div className="space-y-3">

            {/* Section: Reporter Info */}
            <SectionHeader label="Reporter Information" sectionKey="reporter" icon={User} expanded={expandedSections.reporter} onToggle={toggleSection} />
            {expandedSections.reporter && (
              <div className="space-y-3 pl-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Your Role</label>
                    <Select value={form.reporter_role} onValueChange={v => setForm(p => ({ ...p, reporter_role: v }))}>
                      <SelectTrigger data-testid="ict-role-select"><SelectValue placeholder="Select your role..." /></SelectTrigger>
                      <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Department</label>
                    <Select value={form.department} onValueChange={v => setForm(p => ({ ...p, department: v }))}>
                      <SelectTrigger data-testid="ict-department-select"><SelectValue placeholder="Select department..." /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Reporting for yourself?</label>
                    <Select value={form.reporting_for_self} onValueChange={v => setForm(p => ({ ...p, reporting_for_self: v }))}>
                      <SelectTrigger data-testid="ict-self-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No, reporting for someone else</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Location</label>
                    <Input placeholder="e.g. Head Office, Floor 3..." value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} data-testid="ict-location-input" />
                  </div>
                </div>
                {form.reporting_for_self === 'No' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                    <div>
                      <label className="text-sm font-medium mb-1 block">User&apos;s Name</label>
                      <Input placeholder="Name of the affected user..." value={form.other_user_name} onChange={e => setForm(p => ({ ...p, other_user_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">User&apos;s Email</label>
                      <Input placeholder="user@email.com" type="email" value={form.other_user_email} onChange={e => setForm(p => ({ ...p, other_user_email: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section: Request Details */}
            <SectionHeader label="Request Details" sectionKey="request" icon={Monitor} expanded={expandedSections.request} onToggle={toggleSection} />
            {expandedSections.request && (
              <div className="space-y-3 pl-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Request Type *</label>
                    <Select value={form.request_type} onValueChange={v => setForm(p => ({ ...p, request_type: v }))}>
                      <SelectTrigger data-testid="ict-request-type-select"><SelectValue placeholder="Select request type..." /></SelectTrigger>
                      <SelectContent>{REQUEST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                      <SelectTrigger data-testid="ict-priority-select"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description / Complete Details *</label>
                  <Textarea placeholder="Please provide complete details of the issue..." rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} data-testid="ict-description-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Device/Equipment Affected</label>
                    <Input placeholder="e.g. computer, tablet, printer..." value={form.device_equipment} onChange={e => setForm(p => ({ ...p, device_equipment: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Who is Affected?</label>
                    <Input placeholder="Individual, team, department..." value={form.who_is_affected} onChange={e => setForm(p => ({ ...p, who_is_affected: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Additional Details (collapsible) */}
            <SectionHeader label="Symptoms & Troubleshooting" sectionKey="details" icon={AlertTriangle} expanded={expandedSections.details} onToggle={toggleSection} />
            {expandedSections.details && (
              <div className="space-y-3 pl-1">
                <div>
                  <label className="text-sm font-medium mb-1 block">Specific Symptoms / Issues</label>
                  <Textarea placeholder="What specific symptoms or issues are you experiencing?" rows={2} value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Error Messages (if any)</label>
                  <Textarea placeholder="Copy any error messages displayed..." rows={2} value={form.error_messages} onChange={e => setForm(p => ({ ...p, error_messages: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Troubleshooting Attempted?</label>
                    <Select value={form.troubleshooting_attempted} onValueChange={v => setForm(p => ({ ...p, troubleshooting_attempted: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.troubleshooting_attempted === 'Yes' && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Troubleshooting Results</label>
                      <Input placeholder="What were the results?" value={form.troubleshooting_results} onChange={e => setForm(p => ({ ...p, troubleshooting_results: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section: HR Related */}
            <SectionHeader label="HR-Related Request" sectionKey="hr" icon={Shield} expanded={expandedSections.hr} onToggle={toggleSection} />
            {expandedSections.hr && (
              <div className="space-y-3 pl-1">
                <div>
                  <label className="text-sm font-medium mb-1 block">Is this an HR-related request?</label>
                  <Select value={form.is_hr_related} onValueChange={v => setForm(p => ({ ...p, is_hr_related: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">No, just a general ICT issue</SelectItem>
                      <SelectItem value="Yes">Yes, I have an HR-specific request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.is_hr_related === 'Yes' && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">HR Details</label>
                      <Textarea placeholder="Please specify more information about the HR request..." rows={2} value={form.hr_details} onChange={e => setForm(p => ({ ...p, hr_details: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">HR Email</label>
                      <Input placeholder="HR email for connecting to resolve the issue..." type="email" value={form.hr_email} onChange={e => setForm(p => ({ ...p, hr_email: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Section: Contact Info */}
            <SectionHeader label="Contact Information" sectionKey="contact" icon={Phone} expanded={expandedSections.contact} onToggle={toggleSection} />
            {expandedSections.contact && (
              <div className="space-y-3 pl-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Contact Number / Non-work Email</label>
                    <Input placeholder="Phone or personal email..." value={form.contact_number} onChange={e => setForm(p => ({ ...p, contact_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Work Email</label>
                    <Input placeholder="work@email.com" type="email" value={form.work_email} onChange={e => setForm(p => ({ ...p, work_email: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700" data-testid="ict-submit-btn">
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Request Detail Dialog ===== */}
      <Dialog open={!!selectedRequest} onOpenChange={open => { if (!open) setSelectedRequest(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-gray-400 mb-0.5">{selectedRequest.ticket_number || 'ICT Request'}</p>
                    <DialogTitle className="text-lg">{selectedRequest.request_type || selectedRequest.title || 'ICT Request'}</DialogTitle>
                    <p className="text-xs text-gray-500 mt-1">Submitted by {selectedRequest.submitted_by_name} on {new Date(selectedRequest.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge className={STATUS_CONFIG[selectedRequest.status]?.color || ''}>{selectedRequest.status}</Badge>
                    <Badge className={PRIORITY_CONFIG[selectedRequest.priority] || ''}>{selectedRequest.priority}</Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {selectedRequest.department && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-gray-400 text-xs block mb-0.5">Department</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.department}</span>
                    </div>
                  )}
                  {selectedRequest.reporter_role && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-gray-400 text-xs block mb-0.5">Role</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.reporter_role}</span>
                    </div>
                  )}
                  {selectedRequest.location && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-gray-400 text-xs block mb-0.5">Location</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.location}</span>
                    </div>
                  )}
                  {selectedRequest.device_equipment && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-gray-400 text-xs block mb-0.5">Device/Equipment</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.device_equipment}</span>
                    </div>
                  )}
                  {selectedRequest.who_is_affected && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-gray-400 text-xs block mb-0.5">Who is Affected</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.who_is_affected}</span>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-gray-400 text-xs block mb-0.5">Assigned To</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.assigned_to_name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Reporting for someone else */}
                {selectedRequest.reporting_for_self === 'No' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900 text-sm">
                    <span className="text-amber-600 dark:text-amber-400 font-medium text-xs block mb-1">Reported on behalf of:</span>
                    <span className="text-gray-900 dark:text-white">{selectedRequest.other_user_name} ({selectedRequest.other_user_email})</span>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded-lg p-3">{selectedRequest.description}</p>
                </div>

                {/* Symptoms & Errors */}
                {(selectedRequest.symptoms || selectedRequest.error_messages) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRequest.symptoms && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Symptoms</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">{selectedRequest.symptoms}</p>
                      </div>
                    )}
                    {selectedRequest.error_messages && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Error Messages</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 font-mono text-xs">{selectedRequest.error_messages}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Troubleshooting */}
                {selectedRequest.troubleshooting_attempted === 'Yes' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Troubleshooting Attempted</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">{selectedRequest.troubleshooting_results || 'Yes (no details provided)'}</p>
                  </div>
                )}

                {/* HR Section */}
                {selectedRequest.is_hr_related === 'Yes' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900 text-sm">
                    <span className="text-purple-600 dark:text-purple-400 font-medium text-xs block mb-1">HR-Related Request</span>
                    {selectedRequest.hr_details && <p className="text-gray-700 dark:text-gray-300 mb-1">{selectedRequest.hr_details}</p>}
                    {selectedRequest.hr_email && <p className="text-gray-500 text-xs">HR Email: {selectedRequest.hr_email}</p>}
                  </div>
                )}

                {/* Contact Info */}
                {(selectedRequest.contact_number || selectedRequest.work_email) && (
                  <div className="flex gap-4 text-sm text-gray-500">
                    {selectedRequest.work_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selectedRequest.work_email}</span>}
                    {selectedRequest.contact_number && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedRequest.contact_number}</span>}
                  </div>
                )}

                {/* Resolution Notes */}
                {selectedRequest.resolution_notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Resolution Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-900">{selectedRequest.resolution_notes}</p>
                  </div>
                )}

                {/* Admin Notes */}
                {isAdmin && selectedRequest.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Internal Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-900">{selectedRequest.notes}</p>
                  </div>
                )}

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2 flex-wrap border-t pt-4">
                    <span className="text-sm font-medium text-gray-500 mr-1">Status:</span>
                    {STATUSES.map(s => (
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
