import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Hammer, Plus, ExternalLink, Github, Globe, Loader2, Pencil, Clock, CheckCircle } from 'lucide-react';
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
  const [form, setForm] = useState({ title: '', description: '', builder_project_id: '', repo_url: '', demo_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
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
        toast({ title: editId ? 'Project updated!' : 'Project submitted!' });
        setShowCreate(false);
        setForm({ title: '', description: '', builder_project_id: '', repo_url: '', demo_url: '' });
        setEditId(null);
        fetchProjects();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
    finally { setSubmitting(false); }
  };

  const openEdit = (p) => {
    setForm({ title: p.title, description: p.description, builder_project_id: p.builder_project_id || '', repo_url: p.repo_url || '', demo_url: p.demo_url || '' });
    setEditId(p.id);
    setShowCreate(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Capstone Projects | Munal AI Academy</title></Helmet>
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8" data-testid="capstone-projects-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-orange-600" />
              </div>
              Capstone Projects
            </h1>
            <p className="text-sm text-gray-500 mt-1">Build real projects to showcase your skills. Link to Munal AI Builder for full-stack projects.</p>
          </div>
          <Button onClick={() => { setEditId(null); setForm({ title: '', description: '', builder_project_id: '', repo_url: '', demo_url: '' }); setShowCreate(true); }}
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
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">Start your first capstone project to apply everything you've learned. Connect it to Munal AI Builder for full-stack projects.</p>
            <Button onClick={() => setShowCreate(true)} className="bg-orange-600 hover:bg-orange-700 gap-2">
              <Plus className="w-4 h-4" /> Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-lg transition-shadow" data-testid={`capstone-${p.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn("text-[10px] capitalize", p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>
                        {p.status}
                      </Badge>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  </Button>
                </div>
                {p.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  {p.repo_url && (
                    <a href={p.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                      <Github className="w-3.5 h-3.5" /> Repository
                    </a>
                  )}
                  {p.demo_url && (
                    <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                      <Globe className="w-3.5 h-3.5" /> Live Demo
                    </a>
                  )}
                  {p.builder_project_id && (
                    <span className="flex items-center gap-1.5 text-xs text-violet-600">
                      <Hammer className="w-3.5 h-3.5" /> AI Builder Project
                    </span>
                  )}
                </div>
                {p.feedback && (
                  <div className="mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300"><strong>Feedback:</strong> {p.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg" data-testid="capstone-dialog">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Project' : 'New Capstone Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Project Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="My AI-Powered App" data-testid="capstone-title" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what you built, technologies used, and key learnings..." rows={4} data-testid="capstone-description" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">AI Builder Project ID (optional)</label>
              <Input value={form.builder_project_id} onChange={e => setForm(f => ({ ...f, builder_project_id: e.target.value }))} placeholder="Paste your AI Builder project ID" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">GitHub URL</label>
                <Input value={form.repo_url} onChange={e => setForm(f => ({ ...f, repo_url: e.target.value }))} placeholder="https://github.com/..." data-testid="capstone-repo" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Demo URL</label>
                <Input value={form.demo_url} onChange={e => setForm(f => ({ ...f, demo_url: e.target.value }))} placeholder="https://..." data-testid="capstone-demo" />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()} className="w-full bg-orange-600 hover:bg-orange-700 gap-2" data-testid="submit-capstone-btn">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editId ? 'Update Project' : 'Submit Project'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CapstoneProjects;
