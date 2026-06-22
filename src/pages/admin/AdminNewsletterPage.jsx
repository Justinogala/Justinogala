import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail, Users, Send, Plus, Trash2, Upload, Search, RefreshCw,
  FileText, Image, Loader2, CheckCircle2, AlertCircle, Clock,
  X, Download, UserPlus, Filter, LayoutTemplate, Sparkles,
  ChevronLeft, ChevronRight, Eye, Copy, Wifi, WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { format } from 'date-fns';
import PageTransition from '@/components/PageTransition';

const REFRESH_INTERVAL = 20;

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('admin_token') || '""'); } catch { return localStorage.getItem('admin_token') || ''; }
};

const authHeaders = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

// ─── Campaign Editor ───
function CampaignEditor({ campaign, templates, onSave, onCancel, onSend, onGenerateImage }) {
  const [name, setName] = useState(campaign?.name || '');
  const [subject, setSubject] = useState(campaign?.subject || '');
  const [bodyHtml, setBodyHtml] = useState(campaign?.body_html || '');
  const [senderName, setSenderName] = useState(campaign?.sender_name || 'Munal AI');
  const [replyTo, setReplyTo] = useState(campaign?.reply_to || '');
  const [segment, setSegment] = useState(campaign?.segment || '');
  const [showTemplates, setShowTemplates] = useState(!campaign);
  const [preview, setPreview] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleTemplate = (t) => { setBodyHtml(t.html); setShowTemplates(false); };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratingImage(true);
    const url = await onGenerateImage(imagePrompt);
    if (url) {
      const imgTag = `<div style="text-align:center;margin:20px 0;"><img src="${url.startsWith('http') ? url : `https://munal.ai${url}`}" alt="Newsletter Image" style="max-width:100%;border-radius:8px;" /></div>`;
      setBodyHtml(prev => {
        const idx = prev.indexOf('</div>');
        if (idx > 100) return prev.slice(0, idx) + imgTag + prev.slice(idx);
        return imgTag + prev;
      });
    }
    setGeneratingImage(false);
    setImagePrompt('');
  };

  return (
    <div className="space-y-4">
      {/* Template Picker */}
      {showTemplates && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-violet-500" /> Start from a Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {templates.map(t => (
                <button key={t.id} onClick={() => handleTemplate(t)}
                  className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all text-left"
                  data-testid={`template-${t.id}`}>
                  <LayoutTemplate className="w-5 h-5 text-violet-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{t.preview}</p>
                </button>
              ))}
              <button onClick={() => setShowTemplates(false)}
                className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 hover:border-violet-300 text-center transition-all">
                <FileText className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">Blank Email</p>
                <p className="text-[11px] text-gray-400 mt-1">Start from scratch</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-xs mb-1.5 block">Campaign Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="June Newsletter" data-testid="campaign-name" /></div>
            <div><Label className="text-xs mb-1.5 block">Subject Line</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's new at Munal AI" data-testid="campaign-subject" /></div>
            <div><Label className="text-xs mb-1.5 block">Sender Name</Label>
              <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Munal AI" /></div>
            <div><Label className="text-xs mb-1.5 block">Reply-To Email</Label>
              <Input value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="support@munal.ai" /></div>
          </div>
          <div><Label className="text-xs mb-1.5 block">Target Segment (empty = all contacts)</Label>
            <Input value={segment} onChange={e => setSegment(e.target.value)} placeholder="e.g., subscribers, users, prospects" /></div>

          {/* AI Image Generator */}
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30">
            <Label className="text-xs mb-1.5 block text-violet-700 dark:text-violet-300 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AI Image Generator</Label>
            <div className="flex gap-2">
              <Input value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="flex-1 bg-white dark:bg-slate-800" data-testid="image-prompt" />
              <Button onClick={handleGenerateImage} disabled={generatingImage || !imagePrompt.trim()} size="sm" className="bg-violet-600 hover:bg-violet-700">
                {generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* HTML Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs">Email Body (HTML)</Label>
              <button onClick={() => setPreview(!preview)} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {preview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {preview ? (
              <div className="border rounded-xl p-4 bg-white dark:bg-slate-900 min-h-[300px]" data-testid="email-preview">
                <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              </div>
            ) : (
              <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)} rows={12}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                placeholder="<div>Your email HTML here...</div>" data-testid="campaign-body" />
            )}
            <p className="text-[10px] text-gray-400 mt-1">Use {'{{name}}'} and {'{{email}}'} for personalization</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => onSave({ name, subject, body_html: bodyHtml, sender_name: senderName, reply_to: replyTo, segment })}
              disabled={!name || !subject || !bodyHtml} className="bg-violet-600 hover:bg-violet-700" data-testid="save-campaign-btn">
              <FileText className="w-4 h-4 mr-1.5" /> Save Draft
            </Button>
            {campaign?.id && campaign?.status === 'draft' && (
              <Button onClick={() => onSend(campaign.id)} className="bg-emerald-600 hover:bg-emerald-700" data-testid="send-campaign-btn">
                <Send className="w-4 h-4 mr-1.5" /> Send Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───
export default function AdminNewsletterPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsTotalPages, setContactsTotalPages] = useState(1);
  const [segments, setSegments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [newContact, setNewContact] = useState({ email: '', name: '', segment: 'general' });
  const [addingContact, setAddingContact] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fileInputRef = useRef(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/campaigns`, { headers: authHeaders() });
      if (res.ok) setCampaigns(await res.json());
    } catch {}
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: contactsPage.toString(), limit: '50' });
      if (search) params.set('search', search);
      if (segmentFilter) params.set('segment', segmentFilter);
      const res = await fetch(`${API_URL}/api/admin/newsletter/contacts?${params}`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setContacts(d.contacts); setContactsTotal(d.total); setContactsTotalPages(d.total_pages); }
    } catch {}
  }, [contactsPage, search, segmentFilter]);

  const loadSegments = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/contacts/segments`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setSegments(d.segments || []); }
    } catch {}
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/templates`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); }
    } catch {}
  }, []);

  const refreshAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    await Promise.all([loadCampaigns(), loadContacts(), loadSegments()]);
    if (!silent) setLoading(false);
    setLastUpdated(new Date());
    setCountdown(REFRESH_INTERVAL);
  }, [loadCampaigns, loadContacts, loadSegments]);

  useEffect(() => { refreshAll(); loadTemplates(); }, []);
  useEffect(() => { loadContacts(); }, [loadContacts]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { refreshAll(true); return REFRESH_INTERVAL; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshAll]);

  // Campaign actions
  const saveCampaign = async (data) => {
    try {
      if (editingCampaign?.id) {
        await fetch(`${API_URL}/api/admin/newsletter/campaigns/${editingCampaign.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
        toast({ title: 'Campaign updated' });
      } else {
        const res = await fetch(`${API_URL}/api/admin/newsletter/campaigns`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
        if (res.ok) { const c = await res.json(); setEditingCampaign(c); toast({ title: 'Campaign created' }); }
      }
      loadCampaigns();
    } catch { toast({ variant: 'destructive', title: 'Failed to save campaign' }); }
  };

  const sendCampaign = async (id) => {
    if (!window.confirm('Send this campaign to all matching contacts?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/campaigns/${id}/send`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { const d = await res.json(); toast({ title: `Sending to ${d.contact_count} contacts` }); loadCampaigns(); }
      else { const e = await res.json(); toast({ variant: 'destructive', title: e.detail || 'Send failed' }); }
    } catch { toast({ variant: 'destructive', title: 'Failed to send' }); }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    await fetch(`${API_URL}/api/admin/newsletter/campaigns/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadCampaigns();
  };

  // Contact actions
  const addContact = async () => {
    if (!newContact.email) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/contacts`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(newContact) });
      if (res.ok) { toast({ title: 'Contact added' }); setNewContact({ email: '', name: '', segment: 'general' }); setAddingContact(false); loadContacts(); loadSegments(); }
      else { const e = await res.json(); toast({ variant: 'destructive', title: e.detail || 'Failed' }); }
    } catch {}
  };

  const importUsers = async () => {
    const res = await fetch(`${API_URL}/api/admin/newsletter/contacts/import-users`, { method: 'POST', headers: authHeaders() });
    if (res.ok) { const d = await res.json(); toast({ title: `Imported ${d.added} users (${d.skipped} skipped)` }); loadContacts(); loadSegments(); }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/admin/newsletter/contacts/import-csv`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    if (res.ok) { const d = await res.json(); toast({ title: `Imported ${d.added} contacts from CSV (${d.skipped} skipped)` }); loadContacts(); loadSegments(); }
    e.target.value = '';
  };

  const deleteContact = async (id) => {
    await fetch(`${API_URL}/api/admin/newsletter/contacts/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadContacts(); loadSegments();
  };

  const generateImage = async (prompt) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/newsletter/generate-image`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ prompt }) });
      if (res.ok) { const d = await res.json(); return d.url; }
      else { toast({ variant: 'destructive', title: 'Image generation failed' }); }
    } catch {} return null;
  };

  const statusBadge = (status) => {
    const cfg = {
      draft: { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
      sending: { cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2, spin: true },
      sent: { cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
      sent_with_errors: { cls: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
    }[status] || { cls: 'bg-gray-100 text-gray-600', icon: Clock };
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", cfg.cls)}>
        <cfg.icon className={cn("w-3 h-3", cfg.spin && "animate-spin")} /> {status}
      </span>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6" data-testid="admin-newsletter">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Mail className="w-6 h-6 text-violet-500" /> Newsletter</h1>
            <p className="text-sm text-gray-500 mt-1">Manage contacts and send bulk email campaigns</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">LIVE</span>
            </div>
            {lastUpdated && <span className="text-xs text-slate-400">{lastUpdated.toLocaleTimeString()}</span>}
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                autoRefresh ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600" : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500"
              )} data-testid="newsletter-auto-refresh">
              {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {autoRefresh ? `${countdown}s` : 'Paused'}
            </button>
            <Button variant="outline" size="sm" onClick={() => refreshAll(false)}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-slate-800">
          {[
            { id: 'campaigns', label: 'Campaigns', icon: Send },
            { id: 'contacts', label: `Contacts (${contactsTotal})`, icon: Users },
            { id: 'new', label: 'New Campaign', icon: Plus },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'new') setEditingCampaign(null); }}
              className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === t.id ? "border-violet-600 text-violet-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )} data-testid={`tab-${t.id}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Campaigns Tab */}
        {tab === 'campaigns' && (
          <div className="space-y-4">
            {/* Segment stats */}
            <div className="flex flex-wrap gap-3">
              {segments.map(s => (
                <div key={s.name} className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                  <span className="text-xs text-gray-400">{s.name}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white ml-2">{s.count}</span>
                </div>
              ))}
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-16">
                <Send className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No campaigns yet</p>
                <Button onClick={() => { setTab('new'); setEditingCampaign(null); }} className="mt-4 bg-violet-600 hover:bg-violet-700" data-testid="create-first-campaign">
                  <Plus className="w-4 h-4 mr-1.5" /> Create Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                          {statusBadge(c.status)}
                        </div>
                        <p className="text-xs text-gray-500 truncate">Subject: {c.subject}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {c.stats?.total > 0 && `${c.stats.sent} sent · ${c.stats.failed} failed · ${c.stats.total} total`}
                          {c.segment && ` · Segment: ${c.segment}`}
                          {c.sent_at && ` · Sent ${format(new Date(c.sent_at), 'MMM d, HH:mm')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.status === 'draft' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setEditingCampaign(c); setTab('new'); }} data-testid={`edit-${c.id}`}>
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => sendCampaign(c.id)} data-testid={`send-${c.id}`}>
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deleteCampaign(c.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {tab === 'contacts' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={e => { setSearch(e.target.value); setContactsPage(1); }}
                  placeholder="Search contacts..." className="pl-10" data-testid="contact-search" />
              </div>
              <Select value={segmentFilter} onValueChange={v => { setSegmentFilter(v === 'all' ? '' : v); setContactsPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Segments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {segments.map(s => <SelectItem key={s.name} value={s.name}>{s.name} ({s.count})</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setAddingContact(true)} data-testid="add-contact-btn"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="import-csv-btn"><Upload className="w-4 h-4 mr-1" /> CSV</Button>
              <Button size="sm" variant="outline" onClick={importUsers} data-testid="import-users-btn"><UserPlus className="w-4 h-4 mr-1" /> Import Users</Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            </div>

            {/* Add contact inline */}
            {addingContact && (
              <Card><CardContent className="p-4 flex items-end gap-3">
                <div className="flex-1"><Label className="text-xs mb-1 block">Email</Label>
                  <Input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" data-testid="new-contact-email" /></div>
                <div className="w-40"><Label className="text-xs mb-1 block">Name</Label>
                  <Input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" /></div>
                <div className="w-32"><Label className="text-xs mb-1 block">Segment</Label>
                  <Input value={newContact.segment} onChange={e => setNewContact(p => ({ ...p, segment: e.target.value }))} placeholder="general" /></div>
                <Button size="sm" onClick={addContact} className="bg-violet-600 hover:bg-violet-700" data-testid="save-contact-btn"><CheckCircle2 className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingContact(false)}><X className="w-4 h-4" /></Button>
              </CardContent></Card>
            )}

            {/* Contact List */}
            <Card>
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {contacts.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-medium text-violet-600 shrink-0">
                          {(c.name || c.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name || c.email}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{c.segment}</Badge>
                        <Badge variant="outline" className="text-[10px] text-gray-400">{c.source}</Badge>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-500 p-1" onClick={() => deleteContact(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No contacts found</div>}
                </div>
              </ScrollArea>
              {contactsTotalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-gray-100 dark:border-slate-800">
                  <span className="text-xs text-gray-400">Page {contactsPage} of {contactsTotalPages} ({contactsTotal} total)</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" disabled={contactsPage <= 1} onClick={() => setContactsPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" disabled={contactsPage >= contactsTotalPages} onClick={() => setContactsPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* New Campaign Tab */}
        {tab === 'new' && (
          <CampaignEditor
            campaign={editingCampaign}
            templates={templates}
            onSave={saveCampaign}
            onCancel={() => { setTab('campaigns'); setEditingCampaign(null); }}
            onSend={sendCampaign}
            onGenerateImage={generateImage}
          />
        )}
      </div>
    </PageTransition>
  );
}
