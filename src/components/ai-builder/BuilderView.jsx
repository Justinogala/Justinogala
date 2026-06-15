import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Sparkles, ChevronLeft, Menu, Loader2, Trash2,
  LayoutDashboard, ClipboardList, Server, Database, Shield,
  Code2, FileText, Map, Rocket, Cog, RefreshCw,
  Download, CheckCircle2, Clock, AlertCircle, Play,
  X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API = getApiUrl();

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'requirements', label: 'Requirements', icon: ClipboardList },
  { id: 'architecture', label: 'Architecture', icon: Server },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'apis', label: 'APIs', icon: Cog },
  { id: 'documentation', label: 'Docs', icon: FileText },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'deployment', label: 'Deploy', icon: Rocket },
];

const APP_TYPES = [
  { id: 'saas', label: 'SaaS Application' },
  { id: 'mobile', label: 'Mobile Application' },
  { id: 'enterprise', label: 'Enterprise System' },
  { id: 'crm', label: 'CRM System' },
  { id: 'erp', label: 'ERP System' },
  { id: 'healthcare', label: 'Healthcare System' },
  { id: 'ai', label: 'AI Application' },
  { id: 'internal', label: 'Internal Tool' },
  { id: 'ecommerce', label: 'E-Commerce Platform' },
  { id: 'automation', label: 'Workflow Automation' },
];

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const codeStr = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  if (!inline && match) {
    return (
      <div className="relative group my-3">
        <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-1.5 rounded-t-lg border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
          <button onClick={() => { navigator.clipboard.writeText(codeStr); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
          customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: '13px' }} {...props}>
          {codeStr}
        </SyntaxHighlighter>
      </div>
    );
  }
  return <code className="bg-gray-100 dark:bg-slate-700 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
}

function getStoredToken() {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    return session.token || null;
  } catch { return null; }
}

// ─── New Project Dialog ───
function NewProjectDialog({ open, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appType, setAppType] = useState('saas');
  const [creating, setCreating] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (open) { setTitle(''); setDescription(''); setAppType('saas'); setTimeout(() => titleRef.current?.focus(), 100); }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setCreating(true);
    await onCreate({ title: title.trim(), description: description.trim(), app_type: appType });
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()} data-testid="new-project-dialog">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">New AI Builder Project</h3>
            <p className="text-xs text-gray-400">Describe your idea and let AI build the blueprint</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Project Name</label>
            <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., TaskFlow Pro"
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              data-testid="project-title-input" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Application Type</label>
            <div className="flex flex-wrap gap-2">
              {APP_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setAppType(t.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    appType === t.id ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-violet-200"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Describe Your Idea</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Describe your product idea in detail. Include target audience, core features, monetization model, and any specific requirements..."
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              data-testid="project-description-input" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={!title.trim() || !description.trim() || description.trim().length < 10 || creating}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                title.trim() && description.trim().length >= 10 && !creating
                  ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
              )} data-testid="create-project-btn">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create & Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Section Content View ───
function SectionContent({ content, isStreaming, streamingContent }) {
  const displayContent = isStreaming ? streamingContent : content;
  if (!displayContent) return null;

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-3 prose-pre:my-0 prose-code:before:content-[''] prose-code:after:content-[''] prose-h2:text-lg prose-h3:text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
        {displayContent}
      </ReactMarkdown>
      {isStreaming && <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 rounded-sm" />}
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const cfg = {
    pending: { icon: Clock, label: 'Not Generated', cls: 'text-gray-400 bg-gray-100 dark:bg-slate-800' },
    generating: { icon: Loader2, label: 'Generating...', cls: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20', spin: true },
    done: { icon: CheckCircle2, label: 'Complete', cls: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    error: { icon: AlertCircle, label: 'Error', cls: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
  }[status] || { icon: Clock, label: status, cls: 'text-gray-400 bg-gray-100' };

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", cfg.cls)}>
      <cfg.icon className={cn("w-3 h-3", cfg.spin && "animate-spin")} />
      {cfg.label}
    </span>
  );
}

// ─── Main Builder View ───
export default function BuilderView({ onSwitchToChat }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streamingSection, setStreamingSection] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const t = getStoredToken();
    if (t) setToken(t);
  }, []);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/ai-builder/projects`, { headers: authHeaders() });
      if (res.ok) setProjects(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, authHeaders]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Load full project
  const loadProject = useCallback(async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${id}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data);
        setActiveTab('overview');
      }
    } catch (e) { console.error(e); }
  }, [token, authHeaders]);

  // Create project
  const handleCreate = async ({ title, description, app_type }) => {
    try {
      const res = await fetch(`${API}/api/ai-builder/projects`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ title, description, app_type }),
      });
      if (res.ok) {
        const project = await res.json();
        setNewProjectOpen(false);
        await loadProjects();
        setActiveProject(project);
        setActiveTab('overview');
        // Auto-generate overview
        setTimeout(() => generateSection('overview', project.id), 300);
      }
    } catch (e) { console.error(e); }
  };

  // Delete project
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await fetch(`${API}/api/ai-builder/projects/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (activeProject?.id === id) setActiveProject(null);
      loadProjects();
    } catch (e) { console.error(e); }
  };

  // Generate a single section via SSE
  const generateSection = async (section, projectId) => {
    const pid = projectId || activeProject?.id;
    if (!pid || !token) return;

    setStreamingSection(section);
    setStreamingContent('');
    setActiveTab(section);

    // Update local state
    if (activeProject) {
      setActiveProject(prev => ({
        ...prev,
        sections: { ...prev.sections, [section]: { ...prev.sections[section], status: 'generating', content: '' } }
      }));
    }

    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${pid}/generate/${section}`, {
        method: 'POST', headers: authHeaders(),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              fullContent += data.content;
              setStreamingContent(fullContent);
              // Auto-scroll
              if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
            } else if (data.type === 'done') {
              setActiveProject(prev => prev ? ({
                ...prev,
                sections: { ...prev.sections, [section]: { content: fullContent, status: 'done', generated_at: new Date().toISOString() } }
              }) : prev);
            } else if (data.type === 'error') {
              setActiveProject(prev => prev ? ({
                ...prev,
                sections: { ...prev.sections, [section]: { content: data.message, status: 'error' } }
              }) : prev);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    }

    setStreamingSection(null);
    setStreamingContent('');
    loadProjects();
  };

  // Generate all sections
  const generateAllSections = async () => {
    if (!activeProject?.id || !token) return;
    setGeneratingAll(true);

    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${activeProject.id}/generate-all`, {
        method: 'POST', headers: authHeaders(),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentSection = '';
      let sectionContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'section_start') {
              currentSection = data.section;
              sectionContent = '';
              setActiveTab(data.section);
              setStreamingSection(data.section);
              setStreamingContent('');
              setActiveProject(prev => prev ? ({
                ...prev,
                sections: { ...prev.sections, [data.section]: { ...prev.sections[data.section], status: 'generating' } }
              }) : prev);
            } else if (data.type === 'chunk') {
              sectionContent += data.content;
              setStreamingContent(sectionContent);
              if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
            } else if (data.type === 'section_done') {
              setActiveProject(prev => prev ? ({
                ...prev,
                sections: { ...prev.sections, [data.section]: { content: sectionContent, status: 'done', generated_at: new Date().toISOString() } }
              }) : prev);
              setStreamingSection(null);
              setStreamingContent('');
            } else if (data.type === 'section_error') {
              setActiveProject(prev => prev ? ({
                ...prev,
                sections: { ...prev.sections, [data.section]: { content: data.message, status: 'error' } }
              }) : prev);
              setStreamingSection(null);
            } else if (data.type === 'all_done') {
              break;
            }
          } catch {}
        }
      }
    } catch (e) { console.error(e); }

    setGeneratingAll(false);
    setStreamingSection(null);
    loadProjects();
    // Reload full project
    if (activeProject?.id) loadProject(activeProject.id);
  };

  const currentSection = activeProject?.sections?.[activeTab] || {};
  const completedCount = activeProject ? Object.values(activeProject.sections || {}).filter(s => s.status === 'done').length : 0;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-slate-950" data-testid="ai-builder-view">
      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-all duration-300 h-full",
        sidebarOpen ? "w-72" : "w-0 overflow-hidden"
      )} data-testid="builder-sidebar">
        <div className="p-3 border-b border-gray-100 dark:border-slate-800">
          <button onClick={() => setNewProjectOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium transition-all shadow-sm"
            data-testid="new-project-btn">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-violet-500 animate-spin" /></div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8 px-4">No projects yet. Create your first!</p>
          ) : (
            projects.map(p => (
              <div key={p.id}
                onClick={() => loadProject(p.id)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                  activeProject?.id === p.id
                    ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                )} data-testid={`project-item-${p.id}`}>
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-violet-500" />
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium">{p.title}</span>
                  <span className="block text-[10px] text-gray-400 truncate">{p.app_type} · {Object.values(p.section_status || {}).filter(s => s === 'done').length}/10 sections</span>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                  className="hidden group-hover:flex p-1 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-slate-800 text-center">
          <span className="text-[10px] text-gray-400">AI Builder · GPT-5.2</span>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <a href="/dashboard" className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white hidden sm:inline">Munal</span>
          </a>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Builder</h2>
              <p className="text-[10px] text-gray-400">Product Architecture Engine</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="ml-auto flex items-center gap-2">
            {activeProject && (
              <button onClick={generateAllSections} disabled={generatingAll || !!streamingSection}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  generatingAll || streamingSection ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                )} data-testid="generate-all-btn">
                {generatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span className="hidden sm:inline">{generatingAll ? 'Generating...' : 'Generate All'}</span>
              </button>
            )}
            <button onClick={onSwitchToChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="switch-to-chat-btn">
              <ChevronRight className="w-4 h-4" /> Chat Mode
            </button>
          </div>
        </div>

        {/* Project View or Empty State */}
        {!activeProject ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-testid="builder-empty-title">AI Builder</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center max-w-lg">
              Describe your product idea and let AI generate a complete blueprint — from business requirements to deployment architecture.
            </p>
            <p className="text-xs text-gray-400 mb-8 text-center max-w-md">
              Works like having a Product Manager, Solution Architect, Database Architect, Security Engineer, and Full-Stack Developer on your team.
            </p>
            <button onClick={() => setNewProjectOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium transition-all shadow-lg shadow-violet-500/20"
              data-testid="start-building-btn">
              <Sparkles className="w-5 h-5" /> Start Building
            </button>
          </div>
        ) : (
          <>
            {/* Project title & progress */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate" data-testid="project-title">{activeProject.title}</h3>
                <p className="text-[10px] text-gray-400 truncate">{activeProject.app_type} · {activeProject.description?.slice(0, 80)}...</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-20 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${(completedCount / 10) * 100}%` }} />
                  </div>
                  {completedCount}/10
                </div>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-0.5 overflow-x-auto px-3 py-2 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 scrollbar-thin">
              {TABS.map(tab => {
                const sec = activeProject.sections?.[tab.id] || {};
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isGenerating = streamingSection === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                      isActive
                        ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent"
                    )} data-testid={`builder-tab-${tab.id}`}>
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                    {tab.label}
                    {sec.status === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </button>
                );
              })}
            </div>

            {/* Section Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5" ref={contentRef} data-testid="section-content">
              <div className="max-w-4xl mx-auto">
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {TABS.find(t => t.id === activeTab)?.label}
                    </h3>
                    <StatusBadge status={currentSection.status || 'pending'} />
                  </div>
                  <button
                    onClick={() => generateSection(activeTab)}
                    disabled={streamingSection === activeTab || generatingAll}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      streamingSection === activeTab || generatingAll
                        ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                        : "bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/30"
                    )} data-testid={`generate-${activeTab}-btn`}>
                    {streamingSection === activeTab ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {currentSection.status === 'done' ? 'Regenerate' : 'Generate'}
                  </button>
                </div>

                {/* Content */}
                {streamingSection === activeTab ? (
                  <SectionContent content="" isStreaming streamingContent={streamingContent} />
                ) : currentSection.status === 'done' && currentSection.content ? (
                  <SectionContent content={currentSection.content} />
                ) : currentSection.status === 'error' ? (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-sm text-red-600 dark:text-red-400">
                    {currentSection.content || 'Generation failed. Please try again.'}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Sparkles, { className: "w-10 h-10 text-gray-200 dark:text-gray-700 mb-4" })}
                    <p className="text-sm text-gray-400 mb-4">This section hasn't been generated yet.</p>
                    <button onClick={() => generateSection(activeTab)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
                      data-testid={`generate-${activeTab}-empty-btn`}>
                      <Sparkles className="w-4 h-4" /> Generate {TABS.find(t => t.id === activeTab)?.label}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <NewProjectDialog open={newProjectOpen} onClose={() => setNewProjectOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
