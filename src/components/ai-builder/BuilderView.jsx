import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Sparkles, ChevronLeft, Menu, Loader2, Trash2,
  LayoutDashboard, ClipboardList, Server, Database, Shield,
  Code2, FileText, Map, Rocket, Cog, RefreshCw,
  Download, CheckCircle2, Clock, AlertCircle, Play,
  X, ChevronRight, Search, Copy, Share2, Link2,
  Edit3, Save, Pencil, HelpCircle, ExternalLink,
  Layers, ShoppingCart, Users, Bot, Heart, Building,
  BookOpen, MessageSquare, Check, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const API = getApiUrl();

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'from-violet-500 to-indigo-500' },
  { id: 'requirements', label: 'Requirements', icon: ClipboardList, color: 'from-blue-500 to-cyan-500' },
  { id: 'architecture', label: 'Architecture', icon: Server, color: 'from-emerald-500 to-teal-500' },
  { id: 'database', label: 'Database', icon: Database, color: 'from-amber-500 to-orange-500' },
  { id: 'security', label: 'Security', icon: Shield, color: 'from-red-500 to-rose-500' },
  { id: 'apis', label: 'APIs', icon: Cog, color: 'from-purple-500 to-fuchsia-500' },
  { id: 'documentation', label: 'Docs', icon: FileText, color: 'from-sky-500 to-blue-500' },
  { id: 'roadmap', label: 'Roadmap', icon: Map, color: 'from-pink-500 to-rose-500' },
  { id: 'code', label: 'Code', icon: Code2, color: 'from-green-500 to-emerald-500' },
  { id: 'deployment', label: 'Deploy', icon: Rocket, color: 'from-orange-500 to-red-500' },
];

const APP_TYPES = [
  { id: 'saas', label: 'SaaS', icon: Rocket },
  { id: 'mobile', label: 'Mobile', icon: Layers },
  { id: 'enterprise', label: 'Enterprise', icon: Building },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'erp', label: 'ERP', icon: Cog },
  { id: 'healthcare', label: 'Healthcare', icon: Heart },
  { id: 'ai', label: 'AI App', icon: Bot },
  { id: 'internal', label: 'Internal', icon: Building },
  { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart },
  { id: 'automation', label: 'Automation', icon: Cog },
];

const TEMPLATE_ICONS = { rocket: Rocket, 'shopping-cart': ShoppingCart, users: Users, contacts: Users, bot: Bot, layout: LayoutDashboard, heart: Heart, building: Building };

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const codeStr = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);
  if (!inline && match) {
    return (
      <div className="relative group my-3">
        <div className="flex items-center justify-between bg-[#1e1e2e] px-4 py-1.5 rounded-t-lg border-b border-gray-700/50">
          <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
          <button onClick={() => { navigator.clipboard.writeText(codeStr); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
          customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: '13px', background: '#1e1e2e' }} {...props}>
          {codeStr}
        </SyntaxHighlighter>
      </div>
    );
  }
  if (!inline && !match && codeStr.includes('\n')) {
    return (
      <div className="relative group my-3">
        <SyntaxHighlighter style={oneDark} language="text" PreTag="div" customStyle={{ fontSize: '13px', background: '#1e1e2e', borderRadius: '0.75rem' }} {...props}>
          {codeStr}
        </SyntaxHighlighter>
      </div>
    );
  }
  return <code className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
}

function getStoredToken() {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const cfg = {
    pending: { icon: Clock, label: 'Pending', cls: 'text-gray-400 bg-gray-100 dark:bg-slate-800' },
    generating: { icon: Loader2, label: 'Generating...', cls: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20', spin: true },
    done: { icon: CheckCircle2, label: 'Done', cls: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    error: { icon: AlertCircle, label: 'Error', cls: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
  }[status] || { icon: Clock, label: status, cls: 'text-gray-400 bg-gray-100' };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", cfg.cls)}>
      <cfg.icon className={cn("w-3 h-3", cfg.spin && "animate-spin")} /> {cfg.label}
    </span>
  );
}

// ─── Section Content ───
function SectionContent({ content, isStreaming, streamingContent }) {
  const text = isStreaming ? streamingContent : content;
  if (!text) return null;
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-3 prose-pre:my-0 prose-code:before:content-[''] prose-code:after:content-[''] prose-h2:text-lg prose-h3:text-base prose-table:text-sm prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-table:border-collapse prose-th:bg-gray-50 dark:prose-th:bg-slate-800 prose-th:border prose-td:border prose-th:border-gray-200 dark:prose-th:border-slate-700 prose-td:border-gray-200 dark:prose-td:border-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>{text}</ReactMarkdown>
      {isStreaming && <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 rounded-sm" />}
    </div>
  );
}

// ─── New Project Dialog ───
function NewProjectDialog({ open, onClose, onCreate, templates }) {
  const [mode, setMode] = useState('blank'); // 'blank' or 'template'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appType, setAppType] = useState('saas');
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (open) { setTitle(''); setDescription(''); setAppType('saas'); setMode('blank'); setSelectedTemplate(null); setTimeout(() => titleRef.current?.focus(), 100); }
  }, [open]);

  if (!open) return null;

  const handleSelectTemplate = (t) => {
    setSelectedTemplate(t);
    setTitle(t.title);
    setDescription(t.description);
    setAppType(t.app_type);
    setMode('blank'); // switch to form with pre-filled data
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setCreating(true);
    await onCreate({ title: title.trim(), description: description.trim(), app_type: appType });
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="new-project-dialog">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">New AI Builder Project</h3>
            <p className="text-xs text-gray-400">Start from scratch or pick a template</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setMode('blank')} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all",
              mode === 'blank' ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "border-gray-200 dark:border-slate-600 text-gray-500 hover:border-violet-200")}>
              <Edit3 className="w-4 h-4" /> Blank Project
            </button>
            <button onClick={() => setMode('template')} className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all",
              mode === 'template' ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300" : "border-gray-200 dark:border-slate-600 text-gray-500 hover:border-violet-200")}>
              <BookOpen className="w-4 h-4" /> From Template
            </button>
          </div>

          {mode === 'template' ? (
            <div className="grid grid-cols-2 gap-3">
              {(templates || []).map(t => {
                const Icon = TEMPLATE_ICONS[t.icon] || Rocket;
                return (
                  <button key={t.id} onClick={() => handleSelectTemplate(t)}
                    className={cn("flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-md",
                      selectedTemplate?.id === t.id ? "border-violet-400 bg-violet-50/50 dark:bg-violet-900/10" : "border-gray-200 dark:border-slate-600 hover:border-violet-200"
                    )} data-testid={`template-${t.id}`}>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{t.description.slice(0, 100)}...</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
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
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        appType === t.id ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                          : "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-violet-200"
                      )} data-testid={`app-type-${t.id}`}>
                      <t.icon className="w-3 h-3" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Describe Your Idea</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  placeholder="Describe your product idea in detail — target audience, core features, monetization model, tech preferences, integrations needed..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  data-testid="project-description-input" />
                <p className="text-[10px] text-gray-400 mt-1">Minimum 10 characters. The more detail, the better the output.</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={!title.trim() || description.trim().length < 10 || creating}
                  className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                    title.trim() && description.trim().length >= 10 && !creating
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm" : "bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
                  )} data-testid="create-project-btn">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {creating ? 'Creating...' : 'Create & Generate'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Search Panel ───
function SearchPanel({ open, onClose, projectId, token, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setQuery(''); setResults([]); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);

  const doSearch = async (q) => {
    if (!q.trim() || !projectId || !token) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${projectId}/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setResults(d.results || []); }
    } catch {}
    setSearching(false);
  };

  useEffect(() => { const t = setTimeout(() => doSearch(query), 300); return () => clearTimeout(t); }, [query]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15%] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()} data-testid="search-panel">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search across all sections..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none" data-testid="search-input" />
          {searching && <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />}
          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-[10px] text-gray-400 font-medium">ESC</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {results.length === 0 && query.trim() && !searching ? (
            <p className="text-sm text-gray-400 text-center py-8">No results found</p>
          ) : (
            results.map((r, i) => (
              <button key={i} onClick={() => { onNavigate(r.section); onClose(); }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-gray-50 dark:border-slate-800">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 whitespace-nowrap">{r.section_label}</span>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{r.snippet}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Share Dialog ───
function ShareDialog({ open, onClose, shareToken, onCreateLink, onRevoke, projectTitle }) {
  if (!open) return null;
  const shareUrl = shareToken ? `${window.location.origin}/ai-builder/shared/${shareToken}` : '';
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()} data-testid="share-dialog">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Share Project</h3>
            <p className="text-[11px] text-gray-400">Anyone with the link can view (read-only)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        {shareToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
              <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input readOnly value={shareUrl} className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 outline-none truncate" />
              <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="px-3 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-medium hover:bg-violet-200 transition-colors">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={onRevoke} className="w-full text-center text-xs text-red-500 hover:text-red-600 py-2">Revoke Link</button>
          </div>
        ) : (
          <button onClick={onCreateLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
            <Link2 className="w-4 h-4" /> Create Share Link
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Clarifying Questions Dialog ───
function ClarifyDialog({ open, onClose, questions, onSubmit }) {
  const [answers, setAnswers] = useState({});
  if (!open || !questions?.length) return null;

  const handleAnswer = (i, val) => setAnswers(prev => ({ ...prev, [i]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="clarify-dialog">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center gap-3 z-10">
          <HelpCircle className="w-5 h-5 text-violet-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Questions</h3>
            <p className="text-[11px] text-gray-400">Help AI understand your idea better</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          {questions.map((q, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {(q.options || []).map((opt, j) => (
                  <button key={j} type="button" onClick={() => handleAnswer(i, opt)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs border transition-all",
                      answers[i] === opt ? "bg-violet-100 dark:bg-violet-900/30 border-violet-300 text-violet-700 dark:text-violet-300"
                        : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-violet-200"
                    )}>{opt}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700">Skip</button>
            <button onClick={() => {
              const formattedAnswers = questions.map((q, i) => ({ question: q.question, answer: answers[i] || 'Not specified' }));
              onSubmit(formattedAnswers);
            }} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
              <Check className="w-4 h-4" /> Save & Generate
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [clarifyQuestions, setClarifyQuestions] = useState([]);
  const [actionsOpen, setActionsOpen] = useState(false);
  const contentRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => { const t = getStoredToken(); if (t) setToken(t); }, []);

  // Close actions dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && activeProject) { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeProject]);

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  const loadProjects = useCallback(async () => {
    if (!token) return;
    try { const res = await fetch(`${API}/api/ai-builder/projects`, { headers: authHeaders() }); if (res.ok) setProjects(await res.json()); } catch {}
    setLoading(false);
  }, [token, authHeaders]);

  const loadTemplates = useCallback(async () => {
    try { const res = await fetch(`${API}/api/ai-builder/templates`); if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); } } catch {}
  }, []);

  useEffect(() => { loadProjects(); loadTemplates(); }, [loadProjects, loadTemplates]);

  const loadProject = useCallback(async (id) => {
    if (!token) return;
    try { const res = await fetch(`${API}/api/ai-builder/projects/${id}`, { headers: authHeaders() }); if (res.ok) { setActiveProject(await res.json()); setActiveTab('overview'); setEditMode(false); } } catch {}
  }, [token, authHeaders]);

  const handleCreate = async ({ title, description, app_type }) => {
    try {
      const res = await fetch(`${API}/api/ai-builder/projects`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ title, description, app_type }) });
      if (res.ok) {
        const project = await res.json();
        setNewProjectOpen(false);
        await loadProjects();
        setActiveProject(project);
        setActiveTab('overview');
        // Fetch clarifying questions
        try {
          const cRes = await fetch(`${API}/api/ai-builder/projects/${project.id}/clarify`, { method: 'POST', headers: authHeaders() });
          if (cRes.ok) { const cData = await cRes.json(); if (cData.questions?.length) { setClarifyQuestions(cData.questions); setClarifyOpen(true); return; } }
        } catch {}
        setTimeout(() => generateSection('overview', project.id), 300);
      }
    } catch {}
  };

  const handleClarifySubmit = async (answers) => {
    setClarifyOpen(false);
    if (activeProject?.id) {
      try {
        await fetch(`${API}/api/ai-builder/projects/${activeProject.id}/clarify-answers`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ answers }) });
        await loadProject(activeProject.id);
      } catch {}
      setTimeout(() => generateSection('overview', activeProject.id), 300);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try { await fetch(`${API}/api/ai-builder/projects/${id}`, { method: 'DELETE', headers: authHeaders() }); if (activeProject?.id === id) setActiveProject(null); loadProjects(); } catch {}
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${id}/duplicate`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { const p = await res.json(); loadProjects(); loadProject(p.id); }
    } catch {}
    setActionsOpen(false);
  };

  const handleShare = async () => {
    if (!activeProject?.id) return;
    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${activeProject.id}/share`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setActiveProject(prev => ({ ...prev, share_token: d.share_token })); }
    } catch {}
  };

  const handleRevokeShare = async () => {
    if (!activeProject?.id) return;
    try {
      await fetch(`${API}/api/ai-builder/projects/${activeProject.id}/share`, { method: 'DELETE', headers: authHeaders() });
      setActiveProject(prev => ({ ...prev, share_token: null }));
    } catch {}
  };

  const handleExport = async (format) => {
    if (!activeProject?.id) return;
    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${activeProject.id}/export/${format}`, { headers: authHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${activeProject.title}.${format}`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {}
    setActionsOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!activeProject?.id) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/ai-builder/projects/${activeProject.id}/sections/${activeTab}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ content: editContent }),
      });
      setActiveProject(prev => ({ ...prev, sections: { ...prev.sections, [activeTab]: { ...prev.sections[activeTab], content: editContent, status: 'done' } } }));
      setEditMode(false);
    } catch {}
    setSaving(false);
  };

  const generateSection = async (section, projectId) => {
    const pid = projectId || activeProject?.id;
    if (!pid || !token) return;
    setStreamingSection(section); setStreamingContent(''); setActiveTab(section); setEditMode(false);
    if (activeProject) setActiveProject(prev => ({ ...prev, sections: { ...prev.sections, [section]: { ...prev.sections[section], status: 'generating', content: '' } } }));
    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${pid}/generate/${section}`, { method: 'POST', headers: authHeaders() });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let fullContent = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') { fullContent += data.content; setStreamingContent(fullContent); if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight; }
            else if (data.type === 'done') { setActiveProject(prev => prev ? ({ ...prev, sections: { ...prev.sections, [section]: { content: fullContent, status: 'done', generated_at: new Date().toISOString() } } }) : prev); }
            else if (data.type === 'error') { setActiveProject(prev => prev ? ({ ...prev, sections: { ...prev.sections, [section]: { content: data.message, status: 'error' } } }) : prev); }
          } catch {}
        }
      }
    } catch {}
    setStreamingSection(null); setStreamingContent(''); loadProjects();
  };

  const generateAllSections = async () => {
    if (!activeProject?.id || !token) return;
    setGeneratingAll(true);
    try {
      const res = await fetch(`${API}/api/ai-builder/projects/${activeProject.id}/generate-all`, { method: 'POST', headers: authHeaders() });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let sectionContent = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'section_start') { sectionContent = ''; setActiveTab(data.section); setStreamingSection(data.section); setStreamingContent(''); setActiveProject(prev => prev ? ({ ...prev, sections: { ...prev.sections, [data.section]: { ...prev.sections[data.section], status: 'generating' } } }) : prev); }
            else if (data.type === 'chunk') { sectionContent += data.content; setStreamingContent(sectionContent); if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight; }
            else if (data.type === 'section_done') { setActiveProject(prev => prev ? ({ ...prev, sections: { ...prev.sections, [data.section]: { content: sectionContent, status: 'done', generated_at: new Date().toISOString() } } }) : prev); setStreamingSection(null); setStreamingContent(''); }
            else if (data.type === 'all_done') break;
          } catch {}
        }
      }
    } catch {}
    setGeneratingAll(false); setStreamingSection(null); loadProjects();
    if (activeProject?.id) loadProject(activeProject.id);
  };

  const currentSection = activeProject?.sections?.[activeTab] || {};
  const completedCount = activeProject ? Object.values(activeProject.sections || {}).filter(s => s.status === 'done').length : 0;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-slate-950" data-testid="ai-builder-view">
      {/* Sidebar */}
      <div className={cn("flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-all duration-300 h-full", sidebarOpen ? "w-72" : "w-0 overflow-hidden")} data-testid="builder-sidebar">
        <div className="p-3 border-b border-gray-100 dark:border-slate-800">
          <button onClick={() => setNewProjectOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium transition-all shadow-sm"
            data-testid="new-project-btn">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-violet-500 animate-spin" /></div>
          : projects.length === 0 ? <p className="text-xs text-gray-400 text-center mt-8 px-4">No projects yet</p>
          : projects.map(p => (
            <div key={p.id} onClick={() => loadProject(p.id)}
              className={cn("group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                activeProject?.id === p.id ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              )} data-testid={`project-item-${p.id}`}>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-violet-500" />
              <div className="flex-1 min-w-0">
                <span className="block truncate font-medium text-xs">{p.title}</span>
                <span className="block text-[10px] text-gray-400">{p.app_type} · {Object.values(p.section_status || {}).filter(s => s === 'done').length}/10</span>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="hidden group-hover:flex p-1 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100 dark:border-slate-800 text-center">
          <span className="text-[10px] text-gray-400">AI Builder · GPT-5.2</span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <a href="/dashboard" className="flex items-center gap-2 mr-1 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white hidden sm:inline">Munal</span>
          </a>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors lg:flex hidden">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Builder</h2>
              <p className="text-[10px] text-gray-400">Product Architecture Engine</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {activeProject && (
              <>
                <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800" title="Search (⌘K)" data-testid="search-btn">
                  <Search className="w-4 h-4" />
                </button>

                {/* Actions dropdown */}
                <div className="relative" ref={actionsRef}>
                  <button onClick={() => setActionsOpen(!actionsOpen)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800" data-testid="actions-btn">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {actionsOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50" data-testid="actions-dropdown">
                      <button onClick={() => { setShareOpen(true); setActionsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <Share2 className="w-4 h-4 text-gray-400" /> Share
                      </button>
                      <button onClick={() => handleDuplicate(activeProject.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <Copy className="w-4 h-4 text-gray-400" /> Duplicate
                      </button>
                      <button onClick={() => handleExport('md')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <Download className="w-4 h-4 text-gray-400" /> Export Markdown
                      </button>
                      <button onClick={() => handleExport('json')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <Download className="w-4 h-4 text-gray-400" /> Export JSON
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={generateAllSections} disabled={generatingAll || !!streamingSection}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    generatingAll || streamingSection ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm"
                  )} data-testid="generate-all-btn">
                  {generatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span className="hidden sm:inline">{generatingAll ? 'Generating...' : 'Generate All'}</span>
                </button>
              </>
            )}
            <button onClick={onSwitchToChat}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="switch-to-chat-btn">
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Chat</span>
            </button>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Empty State or Project */}
        {!activeProject ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Builder</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 text-center max-w-lg">
              Describe your product idea and get a complete blueprint — from business requirements to deployment architecture.
            </p>
            <p className="text-xs text-gray-400 mb-8 text-center max-w-md">
              Your AI Product Manager, Solution Architect, Database Architect, Security Engineer, and Full-Stack Developer.
            </p>
            <button onClick={() => setNewProjectOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium transition-all shadow-lg shadow-violet-500/20"
              data-testid="start-building-btn">
              <Sparkles className="w-5 h-5" /> Start Building
            </button>
          </div>
        ) : (
          <>
            {/* Project Header + Progress */}
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeProject.title}</h3>
                <p className="text-[10px] text-gray-400 truncate">{activeProject.app_type} · {activeProject.description?.slice(0, 80)}...</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(completedCount / 10) * 100}%` }} />
                </div>
                {completedCount}/10
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 overflow-x-auto px-3 py-2 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 scrollbar-thin">
              {TABS.map(tab => {
                const sec = activeProject.sections?.[tab.id] || {};
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isGenerating = streamingSection === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setEditMode(false); }}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                      isActive ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent"
                    )} data-testid={`builder-tab-${tab.id}`}>
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{tab.label}</span>
                    {sec.status === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5" ref={contentRef} data-testid="section-content">
              <div className="max-w-4xl mx-auto">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{TABS.find(t => t.id === activeTab)?.label}</h3>
                    <StatusBadge status={currentSection.status || 'pending'} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Edit toggle */}
                    {currentSection.status === 'done' && !streamingSection && (
                      editMode ? (
                        <>
                          <button onClick={() => setEditMode(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800" title="Cancel edit">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={handleSaveEdit} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium" data-testid="save-edit-btn">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setEditMode(true); setEditContent(currentSection.content || ''); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20" title="Edit section" data-testid="edit-section-btn">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )
                    )}
                    <button onClick={() => generateSection(activeTab)} disabled={streamingSection === activeTab || generatingAll}
                      className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        streamingSection === activeTab || generatingAll ? "bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                          : "bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/30"
                      )} data-testid={`generate-${activeTab}-btn`}>
                      {streamingSection === activeTab ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      {currentSection.status === 'done' ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                </div>

                {/* Edit Mode */}
                {editMode ? (
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                    className="w-full min-h-[60vh] rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                    data-testid="edit-textarea" />
                ) : streamingSection === activeTab ? (
                  <SectionContent content="" isStreaming streamingContent={streamingContent} />
                ) : currentSection.status === 'done' && currentSection.content ? (
                  <SectionContent content={currentSection.content} />
                ) : currentSection.status === 'error' ? (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-sm text-red-600">{currentSection.content || 'Generation failed.'}</div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Sparkles, { className: "w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" })}
                    <p className="text-sm text-gray-400 mb-4">This section hasn't been generated yet.</p>
                    <button onClick={() => generateSection(activeTab)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-medium transition-all shadow-sm"
                      data-testid={`generate-${activeTab}-empty-btn`}>
                      <Sparkles className="w-4 h-4" /> Generate {TABS.find(t => t.id === activeTab)?.label}
                    </button>
                  </div>
                )}

                {/* Version History hint */}
                {currentSection.history?.length > 0 && !editMode && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {currentSection.history.length} previous version{currentSection.history.length > 1 ? 's' : ''} saved
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dialogs */}
      <NewProjectDialog open={newProjectOpen} onClose={() => setNewProjectOpen(false)} onCreate={handleCreate} templates={templates} />
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} projectId={activeProject?.id} token={token} onNavigate={(s) => { setActiveTab(s); setEditMode(false); }} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} shareToken={activeProject?.share_token} onCreateLink={handleShare} onRevoke={handleRevokeShare} projectTitle={activeProject?.title} />
      <ClarifyDialog open={clarifyOpen} onClose={() => { setClarifyOpen(false); if (activeProject?.id) generateSection('overview', activeProject.id); }} questions={clarifyQuestions} onSubmit={handleClarifySubmit} />
    </div>
  );
}
