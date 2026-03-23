import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Loader2, Trash2, Pencil, Eye, ChevronLeft,
  Calendar, Type, AlignLeft, ToggleLeft, List, Hash, GripVertical,
  ClipboardList, CheckCircle, X, Mail, User, Clock, Building2, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'textarea', label: 'Text Area', icon: AlignLeft },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'yesno', label: 'Yes / No', icon: ToggleLeft },
  { value: 'dropdown', label: 'Dropdown', icon: List },
];

const FIELD_ICON_MAP = { text: Type, textarea: AlignLeft, date: Calendar, number: Hash, yesno: ToggleLeft, dropdown: List };

const FieldBuilder = ({ field, index, onChange, onRemove }) => {
  const updateField = (key, value) => onChange(index, { ...field, [key]: value });
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <Badge variant="outline" className="text-xs">{FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <Input placeholder="Field label *" value={field.label} onChange={e => updateField('label', e.target.value)} className="font-medium" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Placeholder text" value={field.placeholder} onChange={e => updateField('placeholder', e.target.value)} className="text-sm" />
        <Input placeholder="Help description" value={field.description} onChange={e => updateField('description', e.target.value)} className="text-sm" />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={field.required} onChange={e => updateField('required', e.target.checked)} className="rounded" />
          Required
        </label>
        <Select value={field.type} onValueChange={v => updateField('type', v)}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {(field.type === 'dropdown' || field.type === 'yesno') && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Options (one per line)</label>
          <Textarea rows={3} placeholder={field.type === 'yesno' ? 'Yes\nNo' : 'Option 1\nOption 2'}
            value={(field.options || []).join('\n')}
            onChange={e => updateField('options', e.target.value.split('\n').filter(Boolean))}
            className="text-sm" />
        </div>
      )}
    </div>
  );
};

export default function AdminFormsPage() {
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();
  const [view, setView] = useState('list');
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Builder state
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderFields, setBuilderFields] = useState([]);
  const [builderWorkspaceId, setBuilderWorkspaceId] = useState('');
  const [builderRecipientEmails, setBuilderRecipientEmails] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [tplRes, wsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/form-templates`),
        fetch(`${API_URL}/api/admin/workspaces-list`),
      ]);
      if (tplRes.ok) {
        const data = await tplRes.json();
        setTemplates(data.templates || []);
      }
      if (wsRes.ok) {
        const data = await wsRes.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openBuilder = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setBuilderName(template.name);
      setBuilderDesc(template.description || '');
      setBuilderFields(template.fields?.map(f => ({ ...f })) || []);
      setBuilderWorkspaceId(template.workspace_id || '');
      setBuilderRecipientEmails((template.recipient_emails || []).join(', '));
    } else {
      setEditingTemplate(null);
      setBuilderName('');
      setBuilderDesc('');
      setBuilderFields([]);
      setBuilderWorkspaceId('');
      setBuilderRecipientEmails('');
    }
    setView('builder');
  };

  const addField = (type) => {
    setBuilderFields(prev => [...prev, {
      id: `field_${Date.now()}`,
      label: '', type, required: false, placeholder: '', description: '',
      options: type === 'yesno' ? ['Yes', 'No'] : [],
    }]);
  };

  const saveTemplate = async () => {
    if (!builderName.trim()) {
      toast({ title: 'Missing name', variant: 'destructive' });
      return;
    }
    if (builderFields.length === 0) {
      toast({ title: 'Add at least one field', variant: 'destructive' });
      return;
    }
    if (!editingTemplate && !builderWorkspaceId) {
      toast({ title: 'Select a workspace', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const emails = builderRecipientEmails.split(',').map(e => e.trim()).filter(Boolean);
    try {
      let url, method, body;
      if (editingTemplate) {
        url = `${API_URL}/api/admin/form-templates/${editingTemplate.id}`;
        method = 'PUT';
        body = { name: builderName, description: builderDesc, fields: builderFields, recipient_emails: emails };
      } else {
        url = `${API_URL}/api/admin/form-templates?workspace_id=${builderWorkspaceId}`;
        method = 'POST';
        body = {
          name: builderName, description: builderDesc, fields: builderFields,
          created_by_id: adminUser?.id || 'admin', created_by_name: adminUser?.name || 'Admin',
          recipient_emails: emails,
        };
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast({ title: editingTemplate ? 'Template Updated' : 'Template Created' });
        setView('list');
        fetchAll();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/form-templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Template Deleted' });
        setDeleteConfirm(null);
        fetchAll();
      }
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const viewSubmissions = async (template) => {
    setSelectedTemplate(template);
    try {
      const res = await fetch(`${API_URL}/api/admin/form-submissions?template_id=${template.id}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (e) { console.error(e); }
    setView('submissions');
  };

  const deleteSubmission = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/form-submissions/${id}`, { method: 'DELETE' });
      viewSubmissions(selectedTemplate);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  // ===== LIST VIEW =====
  if (view === 'list') {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500" /> Form Templates
            </h1>
            <p className="text-sm text-gray-500 mt-1">{templates.length} template{templates.length !== 1 ? 's' : ''} across all workspaces</p>
          </div>
          <Button onClick={() => openBuilder()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" data-testid="admin-new-template-btn">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No Form Templates</h3>
              <p className="text-sm text-gray-500">Create your first form template.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm" data-testid="admin-templates-table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Template Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Workspace</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Fields</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Recipients</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Created</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {templates.map(tpl => (
                  <tr key={tpl.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50" data-testid={`admin-template-${tpl.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium text-gray-900 dark:text-white">{tpl.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{tpl.workspace_name || '---'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{tpl.fields?.length || 0}</td>
                    <td className="px-4 py-3">
                      {(tpl.recipient_emails || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tpl.recipient_emails.map(email => (
                            <Badge key={email} variant="outline" className="text-[10px] px-1.5 gap-0.5">
                              <Mail className="w-2.5 h-2.5" />{email}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={tpl.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {tpl.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(tpl.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => viewSubmissions(tpl)} className="h-7 gap-1" data-testid={`admin-view-subs-${tpl.id}`}>
                          <Eye className="w-3.5 h-3.5" /> Submissions
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openBuilder(tpl)} className="h-7" data-testid={`admin-edit-${tpl.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => setDeleteConfirm(tpl.id)} data-testid={`admin-delete-${tpl.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Template?</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-500">This will permanently delete the template and all its submissions.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteTemplate(deleteConfirm)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ===== BUILDER VIEW =====
  if (view === 'builder') {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('list')} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Form Name *</label>
                  <Input value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="e.g. Maintenance Request Form" data-testid="admin-builder-name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description / Instructions</label>
                  <Textarea rows={3} value={builderDesc} onChange={e => setBuilderDesc(e.target.value)} placeholder="Instructions shown to users..." data-testid="admin-builder-desc" />
                </div>
                {!editingTemplate && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Assign to Workspace *</label>
                    <Select value={builderWorkspaceId} onValueChange={setBuilderWorkspaceId}>
                      <SelectTrigger data-testid="admin-builder-workspace"><SelectValue placeholder="Select workspace..." /></SelectTrigger>
                      <SelectContent>
                        {workspaces.map(ws => <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-500" /> Recipient Emails
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Comma-separated list of emails that will receive submitted form data</p>
                  <Input value={builderRecipientEmails} onChange={e => setBuilderRecipientEmails(e.target.value)}
                    placeholder="admin@org.com, manager@org.com" data-testid="admin-builder-recipients" />
                  {builderRecipientEmails && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {builderRecipientEmails.split(',').map(e => e.trim()).filter(Boolean).map(email => (
                        <Badge key={email} variant="outline" className="text-xs gap-1">
                          <Mail className="w-3 h-3 text-indigo-500" />{email}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fields */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fields ({builderFields.length})</h4>
              {builderFields.map((field, i) => (
                <FieldBuilder key={field.id} field={field} index={i}
                  onChange={(idx, updated) => setBuilderFields(prev => prev.map((f, j) => j === idx ? updated : f))}
                  onRemove={(idx) => setBuilderFields(prev => prev.filter((_, j) => j !== idx))} />
              ))}
              {builderFields.length === 0 && (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                  <AlignLeft className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No fields yet. Add fields from the panel.</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
              <Button onClick={saveTemplate} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700" data-testid="admin-save-template-btn">
                {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                {editingTemplate ? 'Save Changes' : 'Create Template'}
              </Button>
            </div>
          </div>

          {/* Field Type Picker */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add Field</h4>
            <div className="grid grid-cols-2 gap-2">
              {FIELD_TYPES.map(ft => (
                <Button key={ft.value} variant="outline" size="sm" onClick={() => addField(ft.value)}
                  className="justify-start gap-2 h-10" data-testid={`admin-add-field-${ft.value}`}>
                  <ft.icon className="w-4 h-4 text-indigo-500" /> {ft.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== SUBMISSIONS VIEW =====
  if (view === 'submissions') {
    return (
      <div className="space-y-6 p-3 sm:p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('list')} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submissions</h2>
            <p className="text-sm text-gray-500">{selectedTemplate?.name} - {submissions.length} response{submissions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {selectedTemplate?.recipient_emails?.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-900 text-sm">
            <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-indigo-700 dark:text-indigo-400">Recipients: {selectedTemplate.recipient_emails.join(', ')}</span>
          </div>
        )}

        {submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm" data-testid="admin-submissions-table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Submitted By</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Responses</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{sub.submitted_by_name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{sub.submitted_by_email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(sub.submitted_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(sub.responses || {}).slice(0, 3).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-[10px] max-w-[120px] truncate">{String(v)}</Badge>
                        ))}
                        {Object.keys(sub.responses || {}).length > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{Object.keys(sub.responses).length - 3} more</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 gap-1"
                          onClick={() => { setSelectedTemplate(templates.find(t => t.id === sub.template_id) || selectedTemplate); setView('submission-detail'); setSubmissions([sub]); }}>
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => deleteSubmission(sub.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ===== SUBMISSION DETAIL =====
  if (view === 'submission-detail' && submissions.length > 0) {
    const sub = submissions[0];
    return (
      <div className="space-y-6 p-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => viewSubmissions(selectedTemplate)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTemplate?.name}</h2>
            <p className="text-xs text-gray-500">
              By {sub.submitted_by_name} ({sub.submitted_by_email}) on {new Date(sub.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            {selectedTemplate?.fields ? (
              selectedTemplate.fields.map((field, i) => {
                const val = sub.responses?.[field.id] || '';
                const FIcon = FIELD_ICON_MAP[field.type] || Type;
                return (
                  <div key={field.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <label className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <FIcon className="w-3 h-3" /> {i + 1}. {field.label}
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{String(val) || <span className="text-gray-400 italic">No response</span>}</p>
                  </div>
                );
              })
            ) : (
              Object.entries(sub.responses || {}).map(([key, val]) => (
                <div key={key} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="text-xs text-gray-400 block mb-0.5">{key}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{String(val)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
