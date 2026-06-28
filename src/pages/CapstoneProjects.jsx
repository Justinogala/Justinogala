import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Hammer, Plus, Github, Globe, Loader2, Pencil, Clock, CheckCircle, RefreshCw, Eye, X, Maximize2, Minimize2, ExternalLink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const CapstoneProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', repo_url: '', demo_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/academy/capstone-projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { const d = await res.json(); setProjects(d.projects || []); }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const url = editId
        ? `${API_BASE}/api/academy/capstone-projects/${editId}`
        : `${API_BASE}/api/academy/capstone-projects`;
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast({ title: editId ? 'Project updated!' : 'Project created! AI is generating your live demo...' });
        setShowCreate(false);
        setForm({ title: '', description: '', repo_url: '', demo_url: '' });
        setEditId(null);
        fetchProjects();
        if (!editId) {
          // Poll for demo generation
          const d = await res.json().catch(() => null);
          if (d?.project?.id) pollDemo(d.project.id);
        }
      }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
    finally { setSubmitting(false); }
  };

  const handleRegenerate = async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/api/academy/capstone-projects/${projectId}/regenerate-demo`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: 'Regenerating demo...' });
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, demo_status: 'generating' } : p));
        pollDemo(projectId);
      }
    } catch {}
  };

  const pollDemo = (projectId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/academy/capstone-projects/${projectId}/demo-status`);
        if (res.ok) {
          const d = await res.json();
          if (d.status === 'ready') { clearInterval(interval); fetchProjects(); toast({ title: 'Live demo ready!' }); }
          if (d.status === 'failed') { clearInterval(interval); fetchProjects(); toast({ variant: 'destructive', title: 'Demo generation failed' }); }
        }
      } catch {}
    }, 5000);
    setTimeout(() => clearInterval(interval), 120000);
  };

  useEffect(() => {
    projects.filter(p => p.demo_status === 'generating').forEach(p => pollDemo(p.id));
  }, [projects.length]);

  const openEdit = (p) => {
    setForm({ title: p.title, description: p.description, repo_url: p.repo_url || '', demo_url: p.demo_url || '' });
    setEditId(p.id);
    setShowCreate(true);
  };

  const demoUrl = (id) => `${API_BASE}/api/academy/capstone-projects/${id}/demo`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Capstone Projects | Munal AI Academy</title></Helmet>
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-8" data-testid="capstone-projects-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-orange-600" />
              </div>
              Capstone Projects
            </h1>
            <p className="text-sm text-gray-500 mt-1">Build real projects — AI auto-generates a live interactive demo from your description.</p>
          </div>
          <Button onClick={() => { setEditId(null); setForm({ title: '', description: '', repo_url: '', demo_url: '' }); setShowCreate(true); }}
            className="bg-orange-600 hover:bg-orange-700 gap-2" data-testid="new-capstone-btn">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
              <Hammer className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">Create your first capstone project. AI will generate a live interactive demo!</p>
            <Button onClick={() => setShowCreate(true)} className="bg-orange-600 hover:bg-orange-700 gap-2">
              <Plus className="w-4 h-4" /> Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm" data-testid={`capstone-${p.id}`}>
                {/* Live Demo Preview */}
                {p.demo_status === 'ready' && (
                  <div className="relative border-b border-gray-100 dark:border-gray-800" style={{ height: '400px' }}>
                    <iframe src={demoUrl(p.id)} title={`${p.title} Demo`} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" loading="lazy" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={() => setPreviewId(p.id)} className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg shadow-md hover:bg-white transition-colors" title="Fullscreen">
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <a href={demoUrl(p.id)} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-lg shadow-md hover:bg-white transition-colors" title="Open in new tab">
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  </div>
                )}
                {p.demo_status === 'generating' && (
                  <div className="h-48 flex flex-col items-center justify-center border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI is building your live demo...</p>
                    <p className="text-xs text-gray-400 mt-1">This takes 15-30 seconds</p>
                  </div>
                )}

                {/* Project Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{p.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[10px] capitalize", p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{p.status}</Badge>
                        {p.demo_status === 'ready' && <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Live Demo</Badge>}
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleRegenerate(p.id)} data-testid={`regenerate-${p.id}`}>
                        <RefreshCw className="w-3 h-3" /> {p.demo_status === 'ready' ? 'Regenerate' : 'Generate Demo'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mb-3">{p.description}</p>}
                  <div className="flex items-center gap-4 flex-wrap">
                    {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"><Github className="w-3.5 h-3.5" /> Repository</a>}
                    {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"><Globe className="w-3.5 h-3.5" /> External Demo</a>}
                    {p.demo_status === 'ready' && <a href={demoUrl(p.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-orange-600 font-medium"><Hammer className="w-3.5 h-3.5" /> AI Generated Demo</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg" data-testid="capstone-dialog">
          <DialogHeader><DialogTitle>{editId ? 'Edit Project' : 'New Capstone Project'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Project Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="AI-Powered Healthcare System" data-testid="capstone-title" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description <span className="text-orange-500">(AI generates a live demo from this!)</span></label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the app in detail — features, user flows, data it handles. More detail = better demo..." rows={5} data-testid="capstone-description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">GitHub URL (optional)</label>
                <Input value={form.repo_url} onChange={e => setForm(f => ({ ...f, repo_url: e.target.value }))} placeholder="https://github.com/..." data-testid="capstone-repo" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Demo URL (optional)</label>
                <Input value={form.demo_url} onChange={e => setForm(f => ({ ...f, demo_url: e.target.value }))} placeholder="https://..." data-testid="capstone-demo" />
              </div>
            </div>
            {!editId && (
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                  <Hammer className="w-4 h-4 shrink-0" /> AI will auto-generate a live interactive web app demo from your description!
                </p>
              </div>
            )}
            <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()} className="w-full bg-orange-600 hover:bg-orange-700 gap-2" data-testid="submit-capstone-btn">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editId ? 'Update Project' : 'Create & Generate Demo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview */}
      <Dialog open={!!previewId} onOpenChange={() => setPreviewId(null)}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{projects.find(p => p.id === previewId)?.title}</span>
              <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Live Demo</Badge>
            </div>
            <a href={previewId ? demoUrl(previewId) : '#'} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </a>
          </div>
          {previewId && <iframe src={demoUrl(previewId)} title="Demo" className="w-full border-0" style={{ height: 'calc(100% - 44px)' }} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CapstoneProjects;
