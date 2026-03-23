import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Loader2, Trash2, Pencil, Send, Eye, ChevronLeft,
  Calendar, Type, AlignLeft, ToggleLeft, List, Hash, GripVertical,
  ClipboardList, CheckCircle, Clock, User, Mail, X
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

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'textarea', label: 'Text Area', icon: AlignLeft },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'yesno', label: 'Yes / No', icon: ToggleLeft },
  { value: 'dropdown', label: 'Dropdown', icon: List },
];

const FIELD_ICON_MAP = { text: Type, textarea: AlignLeft, date: Calendar, number: Hash, yesno: ToggleLeft, dropdown: List };

// ======== Sub-components ========

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
      <div className="grid grid-cols-2 gap-3">
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
          <Textarea rows={3} placeholder={field.type === 'yesno' ? 'Yes\nNo' : 'Option 1\nOption 2\nOption 3'}
            value={(field.options || []).join('\n')}
            onChange={e => updateField('options', e.target.value.split('\n').filter(Boolean))}
            className="text-sm" />
        </div>
      )}
    </div>
  );
};

const FormRenderer = ({ template, responses, onChange, readOnly = false }) => {
  if (!template?.fields) return null;
  return (
    <div className="space-y-5">
      {template.description && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
          {template.description}
        </div>
      )}
      {template.fields.map((field, i) => {
        const val = responses[field.id] || '';
        const FIcon = FIELD_ICON_MAP[field.type] || Type;
        return (
          <div key={field.id} className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <FIcon className="w-3.5 h-3.5 text-gray-400" />
              {i + 1}. {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.description && <p className="text-xs text-gray-500">{field.description}</p>}

            {field.type === 'text' && (
              <Input placeholder={field.placeholder || 'Enter your answer'} value={val} disabled={readOnly}
                onChange={e => onChange(field.id, e.target.value)} data-testid={`form-field-${field.id}`} />
            )}
            {field.type === 'textarea' && (
              <Textarea rows={3} placeholder={field.placeholder || 'Enter your answer'} value={val} disabled={readOnly}
                onChange={e => onChange(field.id, e.target.value)} data-testid={`form-field-${field.id}`} />
            )}
            {field.type === 'date' && (
              <Input type="date" value={val} disabled={readOnly}
                onChange={e => onChange(field.id, e.target.value)} data-testid={`form-field-${field.id}`} />
            )}
            {field.type === 'number' && (
              <Input type="number" placeholder={field.placeholder || '0'} value={val} disabled={readOnly}
                onChange={e => onChange(field.id, e.target.value)} data-testid={`form-field-${field.id}`} />
            )}
            {field.type === 'yesno' && (
              <div className="flex gap-4" data-testid={`form-field-${field.id}`}>
                {(field.options?.length ? field.options : ['Yes', 'No']).map(opt => (
                  <label key={opt} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                    val === opt ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                  } ${readOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <input type="radio" name={field.id} value={opt} checked={val === opt}
                      onChange={() => onChange(field.id, opt)} className="accent-indigo-600" disabled={readOnly} />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {field.type === 'dropdown' && (
              <Select value={val} onValueChange={v => onChange(field.id, v)} disabled={readOnly}>
                <SelectTrigger data-testid={`form-field-${field.id}`}><SelectValue placeholder={field.placeholder || 'Select...'} /></SelectTrigger>
                <SelectContent>{(field.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
};


// ======== Main Component ========

const WorkspaceForms = ({ workspaceId, userId, userName, userEmail, userRole }) => {
  const { toast } = useToast();
  const [view, setView] = useState('templates'); // templates | builder | fill | submissions | submission-detail
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendAdmin, setBackendAdmin] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Builder state
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderFields, setBuilderFields] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isAdmin = userRole === 'owner' || userRole === 'admin' || backendAdmin;

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/form-templates?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        if (data.is_admin !== undefined) setBackendAdmin(data.is_admin);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [workspaceId, userId]);

  const fetchSubmissions = useCallback(async (templateId) => {
    try {
      let url = `${API_URL}/api/workspaces/${workspaceId}/form-submissions?user_id=${userId}`;
      if (templateId) url += `&template_id=${templateId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (e) { console.error(e); }
  }, [workspaceId, userId]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // --- Actions ---
  const openBuilder = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setBuilderName(template.name);
      setBuilderDesc(template.description || '');
      setBuilderFields(template.fields?.map(f => ({ ...f })) || []);
    } else {
      setEditingTemplate(null);
      setBuilderName('');
      setBuilderDesc('');
      setBuilderFields([]);
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
      toast({ title: 'Missing name', description: 'Please enter a form name.', variant: 'destructive' });
      return;
    }
    if (builderFields.length === 0) {
      toast({ title: 'No fields', description: 'Add at least one field.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const url = editingTemplate
        ? `${API_URL}/api/workspaces/${workspaceId}/form-templates/${editingTemplate.id}?user_id=${userId}`
        : `${API_URL}/api/workspaces/${workspaceId}/form-templates`;
      const body = editingTemplate
        ? { name: builderName, description: builderDesc, fields: builderFields }
        : { name: builderName, description: builderDesc, fields: builderFields, created_by_id: userId, created_by_name: userName };
      const res = await fetch(url, { method: editingTemplate ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        toast({ title: editingTemplate ? 'Template Updated' : 'Template Created' });
        setView('templates');
        fetchTemplates();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save template.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/form-templates/${id}?user_id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Template Deleted' });
        setDeleteConfirm(null);
        fetchTemplates();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const openFillForm = (template) => {
    setSelectedTemplate(template);
    setResponses({});
    setView('fill');
  };

  const submitForm = async () => {
    const required = selectedTemplate.fields.filter(f => f.required);
    const missing = required.filter(f => !responses[f.id] || !String(responses[f.id]).trim());
    if (missing.length > 0) {
      toast({ title: 'Required fields missing', description: `Please fill: ${missing.map(f => f.label).join(', ')}`, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/form-submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selectedTemplate.id, submitted_by_id: userId, submitted_by_name: userName, submitted_by_email: userEmail, responses }),
      });
      if (res.ok) {
        toast({ title: 'Form Submitted', description: 'Your response has been recorded.' });
        setView('templates');
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to submit.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmissions = async (template) => {
    setSelectedTemplate(template);
    await fetchSubmissions(template.id);
    setView('submissions');
  };

  const viewSubmission = (sub) => {
    setSelectedSubmission(sub);
    const tpl = templates.find(t => t.id === sub.template_id);
    setSelectedTemplate(tpl || null);
    setView('submission-detail');
  };

  const deleteSubmission = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/form-submissions/${id}?user_id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Submission Deleted' });
        fetchSubmissions(selectedTemplate?.id);
      }
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  // ======== VIEWS ========

  // --- Templates List ---
  if (view === 'templates') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Forms</h3>
            <p className="text-sm text-gray-500">{templates.length} template{templates.length !== 1 ? 's' : ''} available</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button onClick={() => openBuilder()} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" data-testid="new-form-template-btn">
                <Plus className="w-4 h-4" /> New Template
              </Button>
            )}
          </div>
        </div>

        {templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No Form Templates</h3>
              <p className="text-sm text-gray-500">{isAdmin ? 'Create your first form template to get started.' : 'No forms are available yet.'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map(tpl => (
              <Card key={tpl.id} className="hover:shadow-md transition-shadow border-gray-200 dark:border-gray-800" data-testid={`form-template-${tpl.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tpl.name}</CardTitle>
                        <p className="text-xs text-gray-400">{tpl.fields?.length || 0} fields</p>
                      </div>
                    </div>
                    {!tpl.is_active && <Badge variant="outline" className="text-xs text-amber-600">Inactive</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  {tpl.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{tpl.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={() => openFillForm(tpl)} className="bg-indigo-600 hover:bg-indigo-700 gap-1" data-testid={`fill-form-${tpl.id}`}>
                      <Send className="w-3.5 h-3.5" /> Fill Out
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openSubmissions(tpl)} className="gap-1" data-testid={`view-submissions-${tpl.id}`}>
                      <Eye className="w-3.5 h-3.5" /> Submissions
                    </Button>
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openBuilder(tpl)} className="gap-1" data-testid={`edit-template-${tpl.id}`}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirm(tpl.id)} data-testid={`delete-template-${tpl.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirm Dialog */}
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

  // --- Form Builder ---
  if (view === 'builder') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('templates')} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Config */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Form Name *</label>
                  <Input value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="e.g. Maintenance Request Form" data-testid="builder-name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description / Instructions</label>
                  <Textarea rows={3} value={builderDesc} onChange={e => setBuilderDesc(e.target.value)} placeholder="Instructions shown to users at the top of the form..." data-testid="builder-desc" />
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
              <Button variant="outline" onClick={() => setView('templates')}>Cancel</Button>
              <Button onClick={saveTemplate} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-template-btn">
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
                  className="justify-start gap-2 h-10" data-testid={`add-field-${ft.value}`}>
                  <ft.icon className="w-4 h-4 text-indigo-500" /> {ft.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Fill Form ---
  if (view === 'fill' && selectedTemplate) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('templates')} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTemplate.name}</h3>
        </div>

        {/* Submitter info */}
        <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-900">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-xs text-indigo-500 dark:text-indigo-400">Submitting as</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{userName} ({userEmail})</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <FormRenderer template={selectedTemplate} responses={responses}
              onChange={(fieldId, value) => setResponses(prev => ({ ...prev, [fieldId]: value }))} />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('templates')}>Cancel</Button>
          <Button onClick={submitForm} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700" data-testid="submit-form-btn">
            {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Submit
          </Button>
        </div>
      </div>
    );
  }

  // --- Submissions List ---
  if (view === 'submissions') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('templates')} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submissions</h3>
              <p className="text-sm text-gray-500">{selectedTemplate?.name} - {submissions.length} response{submissions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="submissions-table">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Submitted By</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />{sub.submitted_by_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />{sub.submitted_by_email}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(sub.submitted_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => viewSubmission(sub)} className="gap-1 h-7" data-testid={`view-sub-${sub.id}`}>
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                          {isAdmin && (
                            <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => deleteSubmission(sub.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Submission Detail ---
  if (view === 'submission-detail' && selectedSubmission) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setView('submissions'); fetchSubmissions(selectedTemplate?.id); }} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTemplate?.name || selectedSubmission.template_name}</h3>
            <p className="text-xs text-gray-500">
              Submitted by {selectedSubmission.submitted_by_name} ({selectedSubmission.submitted_by_email}) on {new Date(selectedSubmission.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            {selectedTemplate ? (
              <FormRenderer template={selectedTemplate} responses={selectedSubmission.responses || {}} readOnly />
            ) : (
              <div className="space-y-3">
                {Object.entries(selectedSubmission.responses || {}).map(([key, val]) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-xs text-gray-400 block mb-0.5">{key}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default WorkspaceForms;
