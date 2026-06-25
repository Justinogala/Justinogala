import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Calendar, Plus, Edit2, Trash2, Copy, Users, Download, BarChart3, QrCode, Award, Search,
  ChevronDown, Loader2, Check, X, Clock, Eye, Mail, FileDown, RefreshCw, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';

const API_BASE = window.location.origin;

const statusColors = {
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  waitlisted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const EventFormDialog = ({ open, onOpenChange, event, onSave }) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'AI', event_type: 'Virtual', date: '', end_date: '',
    time: '', duration: '', location: 'Online (Jizira, Munal AI)', status: 'registration_open',
    price: 'Free', seats: 100, banner: '', tags: '', deadline: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        ...event,
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
        date: event.date?.slice(0, 16) || '',
        end_date: event.end_date?.slice(0, 16) || '',
        deadline: event.deadline?.slice(0, 16) || '',
      });
    } else {
      setForm({ title: '', description: '', category: 'AI', event_type: 'Virtual', date: '', end_date: '', time: '', duration: '', location: 'Online (Jizira, Munal AI)', status: 'registration_open', price: 'Free', seats: 100, banner: '', tags: '', deadline: '' });
    }
  }, [event, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [], seats: parseInt(form.seats) || 100 };
    delete payload.id; delete payload._id; delete payload.registered; delete payload.created_at; delete payload.updated_at; delete payload.created_by; delete payload.deleted;
    await onSave(payload);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div><label className="text-xs font-medium mb-1 block">Title *</label><Input value={form.title} onChange={e => set('title', e.target.value)} data-testid="event-form-title" /></div>
          <div><label className="text-xs font-medium mb-1 block">Description</label><Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Category</label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['AI', 'Cloud', 'Cybersecurity', 'DevOps', 'Software Engineering', 'Product Management', 'Data Science'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium mb-1 block">Event Type</label>
              <Select value={form.event_type} onValueChange={v => set('event_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Virtual', 'Hybrid', 'In Person'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Start Date/Time *</label><Input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className="text-xs font-medium mb-1 block">End Date/Time</label><Input type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Time Label</label><Input value={form.time} onChange={e => set('time', e.target.value)} placeholder="9:00 AM EST" /></div>
            <div><label className="text-xs font-medium mb-1 block">Duration</label><Input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="Full Day" /></div>
            <div><label className="text-xs font-medium mb-1 block">Price</label><Input value={form.price} onChange={e => set('price', e.target.value)} placeholder="Free" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Location</label><Input value={form.location} onChange={e => set('location', e.target.value)} /></div>
            <div><label className="text-xs font-medium mb-1 block">Seats</label><Input type="number" value={form.seats} onChange={e => set('seats', e.target.value)} /></div>
          </div>
          <div><label className="text-xs font-medium mb-1 block">Banner Image URL</label><Input value={form.banner} onChange={e => set('banner', e.target.value)} placeholder="https://..." /></div>
          <div><label className="text-xs font-medium mb-1 block">Tags (comma-separated)</label><Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="AI, Workshop" /></div>
          <div><label className="text-xs font-medium mb-1 block">Status</label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['draft', 'registration_open', 'sold_out', 'cancelled', 'completed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700" data-testid="event-form-save">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{event ? 'Update' : 'Create'} Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminEventsPage = () => {
  const { toast } = useToast();
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/events?limit=200`, { headers });
      if (res.ok) { const d = await res.json(); setEvents(d.events || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/analytics/overview`, { headers });
      if (res.ok) setAnalytics(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchApplications = async (eventId) => {
    setAppsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/applications`, { headers });
      if (res.ok) {
        const d = await res.json();
        setApplications(d.applications || []);
      }
    } catch (e) { console.error(e); }
    finally { setAppsLoading(false); }
  };

  useEffect(() => { fetchEvents(); fetchAnalytics(); }, [fetchEvents]);

  const handleSave = async (payload) => {
    const url = editEvent ? `${API_BASE}/api/admin/events/${editEvent.id}` : `${API_BASE}/api/admin/events`;
    const method = editEvent ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) { toast({ title: editEvent ? 'Event updated' : 'Event created' }); setFormOpen(false); setEditEvent(null); fetchEvents(); fetchAnalytics(); }
      else { const d = await res.json(); toast({ variant: 'destructive', title: d.detail || 'Failed' }); }
    } catch { toast({ variant: 'destructive', title: 'Network error' }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${id}`, { method: 'DELETE', headers });
      if (res.ok) { toast({ title: 'Event deleted' }); fetchEvents(); fetchAnalytics(); }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${id}/duplicate`, { method: 'POST', headers });
      if (res.ok) { toast({ title: 'Event duplicated' }); fetchEvents(); }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const handleAppAction = async (appId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/applications/${appId}`, { method: 'PUT', headers, body: JSON.stringify({ status }) });
      if (res.ok) { toast({ title: `Application ${status}` }); if (selectedEvent) fetchApplications(selectedEvent.id); }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const handleExportCSV = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/applications/export`, { headers });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `applications_${eventId}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        toast({ title: 'CSV exported' });
      }
    } catch { toast({ variant: 'destructive', title: 'Export failed' }); }
  };

  const handleGenerateCerts = async (eventId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${eventId}/certificates/generate`, { method: 'POST', headers });
      if (res.ok) { const d = await res.json(); toast({ title: `${d.certificates_generated} certificates generated` }); }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const filteredEvents = searchQuery ? events.filter(e => e.title?.toLowerCase().includes(searchQuery.toLowerCase())) : events;

  return (
    <div className="space-y-6" data-testid="admin-events-page">
      <Helmet><title>Events Management | Admin</title></Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, manage, and analyze events</p>
        </div>
        <Button onClick={() => { setEditEvent(null); setFormOpen(true); }} className="bg-violet-600 hover:bg-violet-700 gap-2" data-testid="create-event-btn">
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: analytics.total_events, icon: Calendar, color: 'text-violet-500' },
            { label: 'Applications', value: analytics.total_applications, icon: Users, color: 'text-blue-500' },
            { label: 'Registered', value: analytics.total_registered, icon: Check, color: 'text-green-500' },
            { label: 'Fill Rate', value: `${analytics.fill_rate}%`, icon: BarChart3, color: 'text-amber-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="events" className="gap-1.5"><Calendar className="w-3.5 h-3.5" /> Events</TabsTrigger>
          <TabsTrigger value="applications" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Applications</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4">
          <div className="mb-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Event</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Registered</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredEvents.map(event => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {event.banner && <img src={event.banner} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{event.title}</p>
                            <p className="text-xs text-gray-400">{event.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{event.date ? new Date(event.date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{event.category}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{event.registered || 0} / {event.seats}</td>
                      <td className="px-4 py-3"><Badge className="text-[10px] capitalize">{event.status?.replace('_', ' ')}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedEvent(event); fetchApplications(event.id); setActiveTab('applications'); }} title="View Applications"><Users className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditEvent(event); setFormOpen(true); }} title="Edit"><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(event.id)} title="Duplicate"><Copy className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExportCSV(event.id)} title="Export CSV"><Download className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleGenerateCerts(event.id)} title="Generate Certificates"><Award className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(event.id)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEvents.length === 0 && <div className="text-center py-10 text-gray-400">No events found</div>}
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-4">
          {selectedEvent ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedEvent.title}</h3>
                  <p className="text-xs text-gray-500">{applications.length} applications</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportCSV(selectedEvent.id)} className="gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export CSV</Button>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(null); setApplications([]); }} className="gap-1.5"><X className="w-3.5 h-3.5" /> Close</Button>
                </div>
              </div>

              {appsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Applicant</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Company</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Experience</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Applied</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {applications.map(app => (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{app.first_name} {app.last_name}</p>
                            <p className="text-xs text-gray-400">{app.email}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{app.company || '-'}<br/><span className="text-xs text-gray-400">{app.position}</span></td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{app.years_experience || '-'} yrs</td>
                          <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", statusColors[app.status] || statusColors.submitted)}>{app.status}</span></td>
                          <td className="px-4 py-3 text-xs text-gray-400">{app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleAppAction(app.id, 'accepted')} title="Accept"><Check className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleAppAction(app.id, 'rejected')} title="Reject"><X className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-500" onClick={() => handleAppAction(app.id, 'waitlisted')} title="Waitlist"><Clock className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {applications.length === 0 && <div className="text-center py-10 text-gray-400">No applications yet</div>}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Select an event to view applications</p>
              <p className="text-gray-400 text-sm mt-1">Click the <Users className="w-3.5 h-3.5 inline" /> icon on any event in the Events tab.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <EventFormDialog open={formOpen} onOpenChange={setFormOpen} event={editEvent} onSave={handleSave} />
    </div>
  );
};

export default AdminEventsPage;
