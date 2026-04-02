import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  FileText, Plus, Trash2, Loader2, Upload, X, RefreshCw, Pencil, Eye, EyeOff, GripVertical
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';

const AdminPDFTemplatesPage = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileRef = useRef(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Custom');
  const [formFields, setFormFields] = useState(['']);
  const [formFile, setFormFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/pdf-templates`);
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormCategory('Custom');
    setFormFields(['']); setFormFile(null); setEditingId(null); setShowForm(false);
  };

  const addField = () => setFormFields(prev => [...prev, '']);
  const removeField = (i) => setFormFields(prev => prev.filter((_, idx) => idx !== i));
  const updateField = (i, val) => setFormFields(prev => prev.map((f, idx) => idx === i ? val : f));

  const handleCreate = async () => {
    if (!formName.trim()) { toast({ variant: 'destructive', title: 'Name is required' }); return; }
    if (!formFile && !editingId) { toast({ variant: 'destructive', title: 'Please upload a PDF' }); return; }
    const cleanFields = formFields.filter(f => f.trim());

    setCreating(true);
    try {
      if (editingId) {
        // Update metadata only
        const res = await fetch(`${API_URL}/api/admin/pdf-templates/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, description: formDesc, category: formCategory, fields: cleanFields }),
        });
        if (!res.ok) throw new Error();
        toast({ title: 'Template updated' });
      } else {
        // Create new
        const fd = new FormData();
        fd.append('name', formName);
        fd.append('description', formDesc);
        fd.append('category', formCategory);
        fd.append('fields', JSON.stringify(cleanFields));
        fd.append('file', formFile);
        const res = await fetch(`${API_URL}/api/admin/pdf-templates`, { method: 'POST', body: fd });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Failed'); }
        toast({ title: 'Template created' });
      }
      resetForm();
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed', description: err.message });
    } finally { setCreating(false); }
  };

  const toggleActive = async (id, current) => {
    try {
      await fetch(`${API_URL}/api/admin/pdf-templates/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t));
    } catch { toast({ variant: 'destructive', title: 'Toggle failed' }); }
  };

  const deleteTemplate = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/pdf-templates/${id}`, { method: 'DELETE' });
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Template deleted' });
    } catch { toast({ variant: 'destructive', title: 'Delete failed' }); }
  };

  const startEdit = (tpl) => {
    setEditingId(tpl.id);
    setFormName(tpl.name);
    setFormDesc(tpl.description || '');
    setFormCategory(tpl.category || 'Custom');
    setFormFields(tpl.fields?.length ? tpl.fields : ['']);
    setFormFile(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 p-1" data-testid="admin-pdf-templates">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-600" />
            PDF Templates
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Upload branded PDF templates with fillable fields for all users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="refresh-templates-btn">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="create-template-btn">
            <Plus className="w-4 h-4 mr-1" /> New Template
          </Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-violet-200 dark:border-violet-800" data-testid="template-form">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editingId ? 'Edit Template' : 'Create New Template'}</CardTitle>
            <CardDescription>Upload a branded PDF and define the fillable field labels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Template Name *</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Company NDA" data-testid="template-name-input" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="e.g. Legal, HR, Finance" data-testid="template-category-input" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Brief description of the template" data-testid="template-desc-input" />
            </div>

            {/* PDF Upload */}
            {!editingId && (
              <div>
                <Label>PDF File *</Label>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-violet-400 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  data-testid="template-file-upload"
                >
                  {formFile ? (
                    <p className="text-sm text-gray-700 dark:text-gray-200">{formFile.name} ({(formFile.size / 1024).toFixed(0)} KB)</p>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">Click to upload PDF (max 25MB)</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFormFile(e.target.files?.[0] || null)} />
              </div>
            )}

            {/* Fields */}
            <div>
              <Label>Fillable Fields</Label>
              <p className="text-xs text-gray-400 mb-2">Users will be prompted to fill these when using the template.</p>
              <div className="space-y-2">
                {formFields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <Input
                      value={f} onChange={e => updateField(i, e.target.value)}
                      placeholder={`Field ${i + 1} label (e.g. Client Name)`}
                      className="flex-1"
                      data-testid={`field-input-${i}`}
                    />
                    {formFields.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeField(i)}>
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addField} data-testid="add-field-btn">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={creating} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="save-template-btn">
                {creating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                {editingId ? 'Update' : 'Create'} Template
              </Button>
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>
      ) : templates.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600 dark:text-gray-300">No custom templates yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first branded PDF template above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3" data-testid="template-list">
          {templates.map(tpl => (
            <Card key={tpl.id} className={`border-border transition-opacity ${!tpl.is_active ? 'opacity-60' : ''}`} data-testid={`admin-template-${tpl.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary truncate">{tpl.name}</p>
                    <Badge variant="outline" className="text-xs">{tpl.category}</Badge>
                    {!tpl.is_active && <Badge variant="outline" className="text-xs text-red-500 border-red-200">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">{tpl.description || 'No description'}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{tpl.page_count} page{tpl.page_count !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-400">{tpl.fields?.length || 0} field{(tpl.fields?.length || 0) !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-400">{new Date(tpl.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={tpl.is_active}
                    onCheckedChange={() => toggleActive(tpl.id, tpl.is_active)}
                    data-testid={`toggle-active-${tpl.id}`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => startEdit(tpl)} data-testid={`edit-template-${tpl.id}`}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTemplate(tpl.id)} data-testid={`delete-template-${tpl.id}`}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPDFTemplatesPage;
