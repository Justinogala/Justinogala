import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Save, X, Loader2, FileText,
  GripVertical, ChevronDown, ChevronUp, AlertTriangle,
  Shield, Zap, HardHat, Pill, Building, AlertOctagon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  'hard-hat': HardHat, 'pill': Pill, 'building': Building, 'alert-triangle': AlertTriangle,
  'shield': Shield, 'zap': Zap, 'alert-octagon': AlertOctagon, 'file-text': FileText,
};

const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select'];
const SEVERITY_OPTIONS = ['minor', 'moderate', 'major', 'critical', 'serious_occurrence'];
const CATEGORIES = ['Injury', 'Medical', 'Property', 'Behavioural', 'Safeguarding', 'Safety', 'SOR', 'Custom'];

const SEVERITY_COLORS = {
  minor: 'bg-blue-100 text-blue-700',
  moderate: 'bg-amber-100 text-amber-700',
  major: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  serious_occurrence: 'bg-red-200 text-red-800',
};

// ===== Field Editor Row =====
const FieldRow = ({ field, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-3 bg-white dark:bg-slate-900 space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
        <Input
          value={field.label}
          onChange={e => onChange(index, 'label', e.target.value)}
          placeholder="Field label"
          className="flex-1 h-8 text-sm"
        />
        <Select value={field.type} onValueChange={v => onChange(index, 'type', v)}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
        </Select>
        <button onClick={() => onChange(index, 'required', !field.required)}
          className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors",
            field.required ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-50 text-slate-400 border-slate-200"
          )}
        >
          {field.required ? 'Required' : 'Optional'}
        </button>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMoveUp(index)} disabled={isFirst} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
          <button onClick={() => onMoveDown(index)} disabled={isLast} className="text-slate-300 hover:text-slate-600 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
        </div>
        <button onClick={() => onRemove(index)} className="text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>
      </div>
      {expanded && (
        <div className="pl-6 space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-slate-400">Field name (slug)</Label>
              <Input value={field.name} onChange={e => onChange(index, 'name', e.target.value)} className="h-7 text-xs" placeholder="field_name" />
            </div>
          </div>
          {field.type === 'select' && (
            <div>
              <Label className="text-[10px] text-slate-400">Options (comma-separated)</Label>
              <Input
                value={(field.options || []).join(', ')}
                onChange={e => onChange(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="h-7 text-xs" placeholder="Option A, Option B, Option C"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== Template Editor Dialog =====
const TemplateEditor = ({ template, open, onClose, onSave }) => {
  const getInitForm = (tpl) => tpl ? {
    name: tpl.name || '',
    category: tpl.category || 'Custom',
    description: tpl.description || '',
    icon: tpl.icon || 'file-text',
    default_severity: tpl.default_severity || 'moderate',
    fields: (tpl.fields || []).map(f => ({ ...f })),
  } : { name: '', category: 'Custom', description: '', icon: 'file-text', default_severity: 'moderate', fields: [] };

  const [form, setForm] = useState(() => getInitForm(template));
  const [saving, setSaving] = useState(false);

  // Reset form when template or open state changes
  useEffect(() => {
    if (open) {
      setForm(getInitForm(template));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  const updateField = (idx, key, val) => {
    setForm(p => ({
      ...p,
      fields: p.fields.map((f, i) => i === idx ? { ...f, [key]: val } : f),
    }));
  };

  const addField = () => {
    setForm(p => ({
      ...p,
      fields: [...p.fields, { name: `field_${p.fields.length + 1}`, label: '', type: 'text', required: false, options: [] }],
    }));
  };

  const removeField = (idx) => setForm(p => ({ ...p, fields: p.fields.filter((_, i) => i !== idx) }));

  const moveField = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.fields.length) return;
    const arr = [...form.fields];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setForm(p => ({ ...p, fields: arr }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form, template?.id);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="ir-template-editor">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create IR/SOR Template'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Template Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Fall Incident" data-testid="ir-tpl-name" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Description</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="What is this template for?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Default Severity</Label>
              <Select value={form.default_severity} onValueChange={v => setForm(p => ({ ...p, default_severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITY_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Icon</Label>
              <Select value={form.icon} onValueChange={v => setForm(p => ({ ...p, icon: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(ICON_MAP).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-slate-500 font-semibold">Template Fields</Label>
              <Button variant="outline" size="sm" onClick={addField} className="h-7 text-xs" data-testid="add-field-btn">
                <Plus className="w-3 h-3 mr-1" /> Add Field
              </Button>
            </div>
            <div className="space-y-2">
              {form.fields.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 border border-dashed rounded-lg">No fields yet. Click &ldquo;Add Field&rdquo; to start building.</p>
              )}
              {form.fields.map((field, idx) => (
                <FieldRow
                  key={idx} field={field} index={idx}
                  onChange={updateField} onRemove={removeField}
                  onMoveUp={() => moveField(idx, -1)} onMoveDown={() => moveField(idx, 1)}
                  isFirst={idx === 0} isLast={idx === form.fields.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-ir-template-btn">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            {template ? 'Update' : 'Create'} Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===== Main Page =====
const AdminIRTemplatesPage = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterCat, setFilterCat] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async (form, existingId) => {
    const url = existingId
      ? `${API_URL}/api/reports/templates/${existingId}`
      : `${API_URL}/api/reports/templates`;
    const method = existingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: existingId ? 'Template updated' : 'Template created' });
        setEditorOpen(false);
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ variant: 'destructive', title: 'Error', description: err.detail || 'Failed to save template' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error saving template' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template permanently?')) return;
    const res = await fetch(`${API_URL}/api/reports/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: 'Template deleted' });
      fetchTemplates();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive', title: 'Error', description: err.detail || 'Cannot delete template' });
    }
  };

  const filtered = filterCat ? templates.filter(t => t.category === filterCat) : templates;

  return (
    <div className="space-y-6" data-testid="admin-ir-templates-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IR / SOR Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage incident report form templates used across the organization</p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setEditorOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700" data-testid="create-ir-template-btn">
          <Plus className="w-4 h-4 mr-1.5" /> New Template
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('')}
          className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            !filterCat ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          )} data-testid="filter-all">All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filterCat === c ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            )} data-testid={`filter-${c.toLowerCase()}`}>{c}</button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tpl => {
            const Icon = ICON_MAP[tpl.icon] || FileText;
            const isDefault = tpl.is_default;
            return (
              <Card key={tpl.id} className="group hover:shadow-md transition-shadow" data-testid={`ir-tpl-card-${tpl.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">{tpl.name}</h3>
                        {isDefault && <Badge variant="outline" className="text-[10px] shrink-0">Default</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tpl.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">{tpl.category}</Badge>
                        <Badge className={cn("text-[10px]", SEVERITY_COLORS[tpl.default_severity] || 'bg-slate-100 text-slate-600')}>
                          {(tpl.default_severity || '').replace('_', ' ')}
                        </Badge>
                        <span className="text-[10px] text-slate-400">{(tpl.fields || []).length} fields</span>
                      </div>
                    </div>
                  </div>
                  {!isDefault && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => { setEditingTemplate(tpl); setEditorOpen(true); }}
                        data-testid={`edit-tpl-${tpl.id}`}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(tpl.id)}
                        data-testid={`delete-tpl-${tpl.id}`}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TemplateEditor
        template={editingTemplate}
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingTemplate(null); }}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdminIRTemplatesPage;
