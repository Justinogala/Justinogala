import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Plus, Search, Pencil, Trash2, ClipboardList, Loader2, X, GripVertical,
  FileText, ChevronDown, ChevronUp, Eye, Lock
} from 'lucide-react';

const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'select', 'file'];
const CATEGORIES = ['Activity', 'Administration', 'Projects', 'Attendance', 'Finance', 'Order Management'];

const AdminApprovalTemplatesPage = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Editor state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Activity');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('file-text');
  const [formScope, setFormScope] = useState('org');
  const [formFields, setFormFields] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/approvals/templates`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const filtered = templates.filter(t =>
    (categoryFilter === 'all' || t.category === categoryFilter) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  const customTemplates = filtered.filter(t => t.is_custom);
  const defaultTemplates = filtered.filter(t => !t.is_custom);

  const openEditor = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormName(template.name);
      setFormCategory(template.category);
      setFormDescription(template.description);
      setFormIcon(template.icon || 'file-text');
      setFormScope(template.scope || 'org');
      setFormFields(template.fields?.map((f, i) => ({ ...f, _key: i })) || []);
    } else {
      setEditingTemplate(null);
      setFormName('');
      setFormCategory('Activity');
      setFormDescription('');
      setFormIcon('file-text');
      setFormScope('org');
      setFormFields([]);
    }
    setShowEditor(true);
  };

  const addField = () => {
    setFormFields(prev => [...prev, { _key: Date.now(), name: '', label: '', type: 'text', required: false, options: [] }]);
  };

  const updateField = (idx, key, value) => {
    setFormFields(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  const removeField = (idx) => {
    setFormFields(prev => prev.filter((_, i) => i !== idx));
  };

  const moveField = (idx, dir) => {
    const newFields = [...formFields];
    const target = idx + dir;
    if (target < 0 || target >= newFields.length) return;
    [newFields[idx], newFields[target]] = [newFields[target], newFields[idx]];
    setFormFields(newFields);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast({ variant: 'destructive', title: 'Template name is required' }); return; }
    if (formFields.length === 0) { toast({ variant: 'destructive', title: 'Add at least one field' }); return; }
    for (const f of formFields) {
      if (!f.name.trim() || !f.label.trim()) {
        toast({ variant: 'destructive', title: 'All fields need a name and label' }); return;
      }
    }

    setSaving(true);
    const payload = {
      name: formName,
      category: formCategory,
      description: formDescription,
      icon: formIcon,
      fields: formFields.map(({ _key, ...rest }) => rest),
      scope: formScope,
    };

    try {
      const url = editingTemplate
        ? `${API_URL}/api/approvals/templates/${editingTemplate.id}`
        : `${API_URL}/api/approvals/templates`;
      const method = editingTemplate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: editingTemplate ? 'Template updated!' : 'Template created!' });
        setShowEditor(false);
        fetchTemplates();
      } else {
        toast({ variant: 'destructive', title: data.detail || 'Failed to save' });
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to save template' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (template) => {
    setDeleting(template.id);
    try {
      const res = await fetch(`${API_URL}/api/approvals/templates/${template.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Template deleted' });
        fetchTemplates();
      } else {
        toast({ variant: 'destructive', title: data.detail || 'Failed to delete' });
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to delete' }); }
    finally { setDeleting(null); }
  };

  const TemplateRow = ({ t, isDefault }) => (
    <div className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors" data-testid={`admin-template-${t.id}`}>
      <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
        <ClipboardList className="w-5 h-5 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{t.name}</p>
          {isDefault && <Badge variant="outline" className="text-[10px] gap-1"><Lock className="w-2.5 h-2.5" />Default</Badge>}
          {t.is_custom && <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Custom</Badge>}
        </div>
        <p className="text-xs text-slate-500 truncate">{t.description}</p>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">{t.category}</Badge>
      <span className="text-xs text-slate-400 w-16 text-center shrink-0">{t.fields?.length || 0} fields</span>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewTemplate(t)} data-testid={`preview-${t.id}`}>
          <Eye className="w-4 h-4 text-slate-400" />
        </Button>
        {t.is_custom && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(t)} data-testid={`edit-${t.id}`}>
              <Pencil className="w-4 h-4 text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t)} disabled={deleting === t.id} data-testid={`delete-${t.id}`}>
              {deleting === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-500" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="admin-approval-templates">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approval Templates</h1>
          <p className="text-sm text-slate-500">Manage organization-wide and custom approval templates</p>
        </div>
        <Button onClick={() => openEditor()} className="bg-violet-600 hover:bg-violet-700" data-testid="create-template-btn">
          <Plus className="w-4 h-4 mr-1" /> Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9" data-testid="template-search-input" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48" data-testid="category-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-400">
          {templates.filter(t => t.is_custom).length} custom / {templates.filter(t => !t.is_custom).length} default
        </div>
      </div>

      {/* Template List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
      ) : (
        <div className="space-y-6">
          {customTemplates.length > 0 && (
            <Card>
              <div className="px-4 py-3 border-b bg-violet-50/50 dark:bg-violet-900/10">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">Custom Templates ({customTemplates.length})</p>
              </div>
              <CardContent className="p-0">
                {customTemplates.map(t => <TemplateRow key={t.id} t={t} isDefault={false} />)}
              </CardContent>
            </Card>
          )}

          <Card>
            <div className="px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-800/30">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Default Templates ({defaultTemplates.length})</p>
            </div>
            <CardContent className="p-0">
              {defaultTemplates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No templates match your filters</div>
              ) : (
                defaultTemplates.map(t => <TemplateRow key={t.id} t={t} isDefault={true} />)
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Template Name *</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. IT Equipment Request" data-testid="template-name-input" />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger data-testid="template-category-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Scope</Label>
                <Select value={formScope} onValueChange={setFormScope}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org">Organization-wide</SelectItem>
                    <SelectItem value="team">Team-specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief description..." rows={2} />
              </div>
            </div>

            {/* Fields Builder */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Form Fields ({formFields.length})</h3>
                <Button variant="outline" size="sm" onClick={addField} data-testid="add-field-btn">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                </Button>
              </div>

              {formFields.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                  No fields yet. Click "Add Field" to start building your template.
                </div>
              )}

              <div className="space-y-3">
                {formFields.map((f, idx) => (
                  <div key={f._key} className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                      <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input value={f.name} onChange={e => updateField(idx, 'name', e.target.value.replace(/\s/g, '_').toLowerCase())} placeholder="field_name" className="text-xs h-8" />
                        <Input value={f.label} onChange={e => updateField(idx, 'label', e.target.value)} placeholder="Display Label" className="text-xs h-8" />
                        <Select value={f.type} onValueChange={v => updateField(idx, 'type', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <label className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                        <input type="checkbox" checked={f.required} onChange={e => updateField(idx, 'required', e.target.checked)} className="rounded" />
                        Req
                      </label>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(idx, -1)} disabled={idx === 0}><ChevronUp className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveField(idx, 1)} disabled={idx === formFields.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => removeField(idx)}><X className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    {f.type === 'select' && (
                      <div className="ml-10">
                        <Input
                          value={(f.options || []).join(', ')}
                          onChange={e => updateField(idx, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                          placeholder="Comma-separated options: Option 1, Option 2, ..."
                          className="text-xs h-7"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700" data-testid="save-template-btn">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{previewTemplate.category}</Badge>
                {previewTemplate.is_custom && <Badge className="bg-violet-100 text-violet-700 text-xs">Custom</Badge>}
                {!previewTemplate.is_custom && <Badge variant="outline" className="text-xs gap-1"><Lock className="w-2.5 h-2.5" />Default</Badge>}
              </div>
              <p className="text-sm text-slate-500">{previewTemplate.description}</p>
              <div className="border-t pt-3">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Fields ({previewTemplate.fields?.length || 0})</p>
                <div className="space-y-1.5">
                  {(previewTemplate.fields || []).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-mono text-slate-400 w-20 truncate">{f.name}</span>
                      <span className="text-sm flex-1">{f.label}</span>
                      <Badge variant="outline" className="text-[10px]">{f.type}</Badge>
                      {f.required && <span className="text-red-500 text-xs">*</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApprovalTemplatesPage;
