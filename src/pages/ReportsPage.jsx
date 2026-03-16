import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileWarning, Plus, Search, Filter, ChevronDown, ChevronRight,
  Clock, AlertTriangle, Shield, Eye, Edit3, Upload, X, Check,
  Loader2, ArrowLeft, User, MapPin, Calendar, FileText, Users,
  Phone, MessageSquare, Paperclip, Activity, Download, Table2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';

const INCIDENT_TYPES = [
  { value: 'injury', label: 'Injury' },
  { value: 'medication_error', label: 'Medication Error' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'behavioural', label: 'Behavioural Incident' },
  { value: 'safeguarding', label: 'Safeguarding Issue' },
  { value: 'near_miss', label: 'Near Miss' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_LEVELS = [
  { value: 'minor', label: 'Minor', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'major', label: 'Major', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'serious_occurrence', label: 'Serious Occurrence (SOR)', color: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200' },
];

const STATUS_BADGES = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const PERSON_ROLES = ['staff', 'client', 'visitor'];

const emptyPerson = { full_name: '', role: 'staff', contact_info: '' };

const defaultForm = {
  incident_date: new Date().toISOString().split('T')[0],
  incident_time: new Date().toTimeString().slice(0, 5),
  location: '',
  department: '',
  incident_type: '',
  incident_type_other: '',
  persons_involved: [{ ...emptyPerson }],
  witnesses: '',
  description: '',
  immediate_action: '',
  was_911_called: false,
  severity: '',
  assigned_investigator: '',
};

// ========= Report Form Component =========
const ReportForm = ({ onSubmit, onCancel, loading, workspaceId, userId }) => {
  const [form, setForm] = useState({ ...defaultForm });
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const fileRef = useRef(null);

  const totalSteps = 5;
  const stepLabels = ['Incident Details', 'Person(s) Involved', 'Description', 'Severity', 'Attachments & Submit'];

  const updateField = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const addPerson = () => setForm(p => ({ ...p, persons_involved: [...p.persons_involved, { ...emptyPerson }] }));
  const updatePerson = (idx, field, value) => {
    setForm(p => ({
      ...p,
      persons_involved: p.persons_involved.map((person, i) => i === idx ? { ...person, [field]: value } : person)
    }));
  };
  const removePerson = (idx) => {
    if (form.persons_involved.length <= 1) return;
    setForm(p => ({ ...p, persons_involved: p.persons_involved.filter((_, i) => i !== idx) }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const canProceed = () => {
    if (step === 1) return form.incident_date && form.incident_time && form.location && form.incident_type;
    if (step === 2) return form.persons_involved[0]?.full_name;
    if (step === 3) return form.description;
    if (step === 4) return form.severity;
    return true;
  };

  const handleSubmit = () => {
    onSubmit({ ...form, workspace_id: workspaceId, submitted_by: userId }, files);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-slate-700 text-gray-500"
              )}>
                {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={cn("w-8 sm:w-16 h-0.5 mx-1", step > i + 1 ? "bg-green-500" : "bg-gray-200 dark:bg-slate-700")} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Step {step}: {stepLabels[step - 1]}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Incident Details */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date of Incident *</Label>
                <Input type="date" value={form.incident_date} onChange={e => updateField('incident_date', e.target.value)} data-testid="ir-date" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time *</Label>
                <Input type="time" value={form.incident_time} onChange={e => updateField('incident_time', e.target.value)} data-testid="ir-time" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location *</Label>
              <Input placeholder="e.g. Building A, Floor 2, Room 204" value={form.location} onChange={e => updateField('location', e.target.value)} data-testid="ir-location" />
            </div>
            <div className="space-y-1.5">
              <Label>Department / Site</Label>
              <Input placeholder="e.g. Nursing, Maintenance" value={form.department} onChange={e => updateField('department', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><FileWarning className="w-3.5 h-3.5" /> Type of Incident *</Label>
              <Select value={form.incident_type} onValueChange={v => updateField('incident_type', v)}>
                <SelectTrigger data-testid="ir-type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.incident_type === 'other' && (
                <Input placeholder="Specify..." className="mt-2" value={form.incident_type_other} onChange={e => updateField('incident_type_other', e.target.value)} />
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Persons Involved */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            {form.persons_involved.map((person, idx) => (
              <Card key={idx} className="relative">
                <CardContent className="pt-4 space-y-3">
                  {form.persons_involved.length > 1 && (
                    <button onClick={() => removePerson(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <p className="text-xs font-medium text-gray-500 uppercase">Person {idx + 1}</p>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Full Name *</Label>
                    <Input placeholder="Full name" value={person.full_name} onChange={e => updatePerson(idx, 'full_name', e.target.value)} data-testid={`person-name-${idx}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select value={person.role} onValueChange={v => updatePerson(idx, 'role', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PERSON_ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Contact</Label>
                      <Input placeholder="Email or phone" value={person.contact_info} onChange={e => updatePerson(idx, 'contact_info', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" size="sm" onClick={addPerson} className="w-full">
              <Plus className="w-4 h-4 mr-1.5" /> Add Another Person
            </Button>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Witnesses</Label>
              <Input placeholder="Names of witnesses (comma-separated)" value={form.witnesses} onChange={e => updateField('witnesses', e.target.value)} />
            </div>
          </motion.div>
        )}

        {/* Step 3: Description */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> What happened? *</Label>
              <Textarea rows={6} placeholder="Provide a detailed description of the incident..." value={form.description} onChange={e => updateField('description', e.target.value)} data-testid="ir-description" />
            </div>
            <div className="space-y-1.5">
              <Label>Immediate Action Taken</Label>
              <Textarea rows={3} placeholder="Describe any immediate actions taken..." value={form.immediate_action} onChange={e => updateField('immediate_action', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Was 911 called?</Label>
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => updateField('was_911_called', val)}
                    className={cn(
                      "px-5 py-2 rounded-lg border-2 font-medium text-sm transition-all",
                      form.was_911_called === val
                        ? val ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20" : "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                    )}
                    data-testid={`ir-911-${val}`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Severity */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
            <Label className="flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Severity Classification *</Label>
            {SEVERITY_LEVELS.map(sev => (
              <button
                key={sev.value}
                type="button"
                onClick={() => updateField('severity', sev.value)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all",
                  form.severity === sev.value
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                )}
                data-testid={`severity-${sev.value}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={cn("text-xs", sev.color)}>{sev.label}</Badge>
                    {sev.value === 'serious_occurrence' && (
                      <span className="text-xs text-red-600 font-medium">Auto-triggers SOR workflow</span>
                    )}
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    form.severity === sev.value ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                  )}>
                    {form.severity === sev.value && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 5: Attachments & Submit */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-2"><Paperclip className="w-3.5 h-3.5" /> Attachments (Optional)</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all"
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload photos, documents, or videos</p>
                <p className="text-xs text-gray-400 mt-1">Max 20MB per file</p>
              </div>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx" />
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
              <CardContent className="pt-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-800 dark:text-white">Report Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600 dark:text-gray-300">
                  <span>Date: {form.incident_date}</span>
                  <span>Time: {form.incident_time}</span>
                  <span>Location: {form.location}</span>
                  <span>Type: {INCIDENT_TYPES.find(t => t.value === form.incident_type)?.label}</span>
                  <span>Severity: <Badge className={cn("text-[10px] ml-1", SEVERITY_LEVELS.find(s => s.value === form.severity)?.color)}>{SEVERITY_LEVELS.find(s => s.value === form.severity)?.label}</Badge></span>
                  <span>Persons: {form.persons_involved.length}</span>
                  <span>911: {form.was_911_called ? 'Yes' : 'No'}</span>
                  <span>Attachments: {files.length}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
          ) : (
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          )}
        </div>
        <div>
          {step < totalSteps ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="bg-indigo-600 hover:bg-indigo-700" data-testid="ir-next-btn">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 min-w-[160px]" data-testid="ir-submit-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <FileWarning className="w-4 h-4 mr-1.5" />}
              Submit Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ========= Report Detail View =========
const ReportDetail = ({ report, onBack, onUpdate, userRole, userId }) => {
  const [editMode, setEditMode] = useState(false);
  const [investigation, setInvestigation] = useState({
    status: report.status,
    assigned_investigator: report.assigned_investigator || '',
    root_cause: report.root_cause || '',
    corrective_action: report.corrective_action || '',
    follow_up_due_date: report.follow_up_due_date || '',
    investigation_notes: report.investigation_notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const canEdit = userRole === 'Admin' || userRole === 'Manager';

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/${report.id}/export/pdf`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.report_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'PDF exported successfully' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to export PDF' });
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/${report.id}?editor_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investigation),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Report updated' });
        onUpdate(data.report);
        setEditMode(false);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error updating report' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Reports</Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} data-testid="export-pdf-btn">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
            Export PDF
          </Button>
          <Badge className={cn("text-xs", STATUS_BADGES[report.status])}>{report.status?.replace('_', ' ')}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", report.report_type === 'SOR' ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30")}>
          <FileWarning className={cn("w-5 h-5", report.report_type === 'SOR' ? "text-red-600" : "text-amber-600")} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{report.report_number}</h2>
          <p className="text-sm text-gray-500">{report.report_type === 'SOR' ? 'Serious Occurrence Report' : 'Incident Report'} • Submitted by {report.submitted_by_name}</p>
        </div>
      </div>

      {/* Sections A-D display */}
      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Section A — Incident Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Date:</span> <span className="font-medium">{report.incident_date}</span></div>
            <div><span className="text-gray-500">Time:</span> <span className="font-medium">{report.incident_time}</span></div>
            <div><span className="text-gray-500">Location:</span> <span className="font-medium">{report.location}</span></div>
            <div><span className="text-gray-500">Department:</span> <span className="font-medium">{report.department || '—'}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Type:</span> <Badge variant="outline" className="ml-1">{INCIDENT_TYPES.find(t => t.value === report.incident_type)?.label || report.incident_type}</Badge></div>
            <div className="col-span-2"><span className="text-gray-500">Severity:</span> <Badge className={cn("ml-1 text-xs", SEVERITY_LEVELS.find(s => s.value === report.severity)?.color)}>{SEVERITY_LEVELS.find(s => s.value === report.severity)?.label}</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Section B — Person(s) Involved</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {report.persons_involved?.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{p.full_name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{p.role}</Badge>
                {p.contact_info && <span className="text-gray-500 text-xs">{p.contact_info}</span>}
              </div>
            ))}
            {report.witnesses && <div className="text-gray-500">Witnesses: <span className="text-gray-700 dark:text-gray-300">{report.witnesses}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Section C — Description</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.description}</p>
            {report.immediate_action && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-xs font-medium text-blue-600 mb-1">Immediate Action Taken</p>
                <p className="text-gray-700 dark:text-gray-300">{report.immediate_action}</p>
              </div>
            )}
            <div>911 Called: <Badge variant={report.was_911_called ? "destructive" : "outline"}>{report.was_911_called ? 'Yes' : 'No'}</Badge></div>
          </CardContent>
        </Card>

        {report.attachments?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Section E — Attachments</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {report.attachments.map(att => (
                <a key={att.id} href={`${API_URL}/api/reports/${report.id}/attachments/${att.id}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-indigo-600">{att.filename}</span>
                  <span className="text-xs text-gray-400">{(att.size / 1024).toFixed(0)} KB</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Section F - Investigation (manager/admin only) */}
        {canEdit && (
          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-gray-500">Section F — Follow-Up & Investigation</CardTitle>
              {!editMode && <Button variant="ghost" size="sm" onClick={() => setEditMode(true)} data-testid="edit-investigation-btn"><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>}
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={investigation.status} onValueChange={v => setInvestigation({...investigation, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Assigned Investigator</Label>
                    <Input value={investigation.assigned_investigator} onChange={e => setInvestigation({...investigation, assigned_investigator: e.target.value})} placeholder="Name of investigator" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Root Cause</Label>
                    <Textarea rows={3} value={investigation.root_cause} onChange={e => setInvestigation({...investigation, root_cause: e.target.value})} placeholder="Root cause analysis..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Corrective Action Plan</Label>
                    <Textarea rows={3} value={investigation.corrective_action} onChange={e => setInvestigation({...investigation, corrective_action: e.target.value})} placeholder="Actions to prevent recurrence..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Due Date</Label>
                      <Input type="date" value={investigation.follow_up_due_date} onChange={e => setInvestigation({...investigation, follow_up_due_date: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Investigation Notes</Label>
                    <Textarea rows={3} value={investigation.investigation_notes} onChange={e => setInvestigation({...investigation, investigation_notes: e.target.value})} placeholder="Additional notes..." />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Status:</span> <Badge className={cn("ml-1 text-xs", STATUS_BADGES[report.status])}>{report.status?.replace('_',' ')}</Badge></div>
                  <div><span className="text-gray-500">Investigator:</span> <span className="font-medium">{report.assigned_investigator || '—'}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Root Cause:</span> <span className="font-medium">{report.root_cause || '—'}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Corrective Action:</span> <span className="font-medium">{report.corrective_action || '—'}</span></div>
                  <div><span className="text-gray-500">Due Date:</span> <span className="font-medium">{report.follow_up_due_date || '—'}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span className="font-medium">{report.investigation_notes || '—'}</span></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Audit Log */}
        {report.audit_log?.length > 0 && canEdit && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Audit Trail</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.audit_log.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="font-medium capitalize">{entry.action}</span>
                    <span>by {entry.by_name || entry.by}</span>
                    <span>• {new Date(entry.at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ========= Main Page =========
const ReportsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState('list'); // list, create, detail
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ report_type: '', severity: '', status: '' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ user_id: user?.id || '', user_role: user?.role || '', page: '1', limit: '50' });
      if (filters.report_type) params.set('report_type', filters.report_type);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.status) params.set('status', filters.status);

      const [reportsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/reports?${params}`),
        fetch(`${API_URL}/api/reports/stats`),
      ]);
      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();
      if (reportsData.success) setReports(reportsData.reports);
      if (statsData.success) setStats(statsData.stats);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filters]);

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const params = new URLSearchParams();
      if (filters.report_type) params.set('report_type', filters.report_type);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.status) params.set('status', filters.status);
      const res = await fetch(`${API_URL}/api/reports/export/excel?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident_reports_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Excel exported successfully' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to export Excel' });
    } finally {
      setExportingExcel(false);
    }
  };

  const handleSubmitReport = async (formData, files) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        // Upload attachments
        if (files.length > 0) {
          for (const file of files) {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('user_id', user.id);
            await fetch(`${API_URL}/api/reports/${data.report.id}/attachments`, { method: 'POST', body: fd });
          }
        }
        toast({ title: 'Report submitted', description: `Report ${data.report.report_number} has been filed.` });
        setView('list');
        fetchReports();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to submit report' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incident Reports</h1>
                  <p className="text-sm text-gray-500 mt-1">IR / SOR reporting and management</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exportingExcel} data-testid="export-excel-btn">
                    {exportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Table2 className="w-3.5 h-3.5 mr-1.5" />}
                    Export Excel
                  </Button>
                  <Button onClick={() => setView('create')} className="bg-indigo-600 hover:bg-indigo-700" data-testid="new-report-btn">
                    <Plus className="w-4 h-4 mr-1.5" /> New Report
                  </Button>
                </div>
              </div>

              {/* Stats cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {[
                    { label: 'Total', value: stats.total, icon: FileText, color: 'text-gray-600' },
                    { label: 'Open', value: stats.open, icon: Clock, color: 'text-blue-600' },
                    { label: 'Under Review', value: stats.under_review, icon: Eye, color: 'text-amber-600' },
                    { label: 'Critical/SOR', value: stats.critical, icon: AlertTriangle, color: 'text-red-600' },
                    { label: 'Closed', value: stats.closed, icon: Check, color: 'text-green-600' },
                  ].map(stat => (
                    <Card key={stat.label}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                          <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <Select value={filters.report_type} onValueChange={v => setFilters({...filters, report_type: v === 'all' ? '' : v})}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="IR">IR</SelectItem>
                    <SelectItem value="SOR">SOR</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.severity} onValueChange={v => setFilters({...filters, severity: v === 'all' ? '' : v})}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    {SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v === 'all' ? '' : v})}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Report list */}
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : reports.length === 0 ? (
                <div className="text-center py-16">
                  <FileWarning className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No reports found</p>
                  <p className="text-sm text-gray-400 mt-1">Click "New Report" to file an incident report</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      onClick={() => { setSelectedReport(report); setView('detail'); }}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
                      data-testid={`report-row-${report.id}`}
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        report.report_type === 'SOR' ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                      )}>
                        <FileWarning className={cn("w-4 h-4", report.report_type === 'SOR' ? "text-red-600" : "text-amber-600")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{report.report_number}</span>
                          <Badge variant="outline" className="text-[10px]">{report.report_type}</Badge>
                          <Badge className={cn("text-[10px]", SEVERITY_LEVELS.find(s => s.value === report.severity)?.color)}>
                            {SEVERITY_LEVELS.find(s => s.value === report.severity)?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {INCIDENT_TYPES.find(t => t.value === report.incident_type)?.label} • {report.location} • {report.submitted_by_name || 'Unknown'}
                        </p>
                      </div>
                      <Badge className={cn("text-[10px] shrink-0", STATUS_BADGES[report.status])}>
                        {report.status?.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-400 shrink-0">{report.incident_date}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">File New Report</h1>
                <p className="text-sm text-gray-500 mt-1">Complete all sections to submit an incident or serious occurrence report</p>
              </div>
              <ReportForm
                onSubmit={handleSubmitReport}
                onCancel={() => setView('list')}
                loading={submitting}
                workspaceId={user?.workspace_id || 'default'}
                userId={user?.id}
              />
            </motion.div>
          )}

          {view === 'detail' && selectedReport && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReportDetail
                report={selectedReport}
                onBack={() => { setView('list'); fetchReports(); }}
                onUpdate={(updated) => setSelectedReport(updated)}
                userRole={user?.role}
                userId={user?.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ReportsPage;
