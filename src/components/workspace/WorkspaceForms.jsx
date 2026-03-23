import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Loader2, Eye, ChevronLeft, Send,
  Calendar, Type, AlignLeft, ToggleLeft, List, Hash,
  ClipboardList, User, Mail, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';

const FIELD_ICON_MAP = { text: Type, textarea: AlignLeft, date: Calendar, number: Hash, yesno: ToggleLeft, dropdown: List };

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

const WorkspaceForms = ({ workspaceId, userId, userName, userEmail }) => {
  const { toast } = useToast();
  const [view, setView] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/form-templates?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [workspaceId, userId]);

  const fetchSubmissions = useCallback(async (templateId) => {
    try {
      let url = `${API_URL}/api/workspaces/${workspaceId}/form-submissions?user_id=${userId}`;
      if (templateId) url += `&template_id=${templateId}`;
      const res = await fetch(url);
      if (res.ok) setSubmissions((await res.json()).submissions || []);
    } catch (e) { console.error(e); }
  }, [workspaceId, userId]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

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
    setSelectedTemplate(templates.find(t => t.id === sub.template_id) || null);
    setView('submission-detail');
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

  // --- Templates List ---
  if (view === 'templates') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Forms</h3>
          <p className="text-sm text-gray-500">{templates.length} form{templates.length !== 1 ? 's' : ''} available</p>
        </div>

        {templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No Forms Available</h3>
              <p className="text-sm text-gray-500">Form templates are managed by your admin.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map(tpl => (
              <Card key={tpl.id} className="hover:shadow-md transition-shadow border-gray-200 dark:border-gray-800" data-testid={`form-template-${tpl.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{tpl.name}</CardTitle>
                      <p className="text-xs text-gray-400">{tpl.fields?.length || 0} fields</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tpl.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{tpl.description}</p>}
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => openFillForm(tpl)} className="bg-indigo-600 hover:bg-indigo-700 gap-1" data-testid={`fill-form-${tpl.id}`}>
                      <Send className="w-3.5 h-3.5" /> Fill Out
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openSubmissions(tpl)} className="gap-1" data-testid={`view-submissions-${tpl.id}`}>
                      <Eye className="w-3.5 h-3.5" /> My Submissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('templates')} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">My Submissions</h3>
            <p className="text-sm text-gray-500">{selectedTemplate?.name} - {submissions.length} response{submissions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">You have no submissions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm" data-testid="submissions-table">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Preview</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-gray-500 text-sm flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />{new Date(sub.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(sub.responses || {}).slice(0, 3).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-[10px] max-w-[120px] truncate">{String(v)}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => viewSubmission(sub)} className="h-7 gap-1" data-testid={`view-sub-${sub.id}`}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
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
            <p className="text-xs text-gray-500">Submitted on {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
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
