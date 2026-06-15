import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  MessageSquarePlus,
  Send,
  Mic,
  MicOff,
  Paperclip,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Bot,
  User,
  ChevronLeft,
  Menu,
  Sparkles,
  Code,
  FileText,
  Lightbulb,
  BrainCircuit,
  Copy,
  CheckCheck,
  ImageIcon,
  FileIcon,
  StopCircle,
  RefreshCw,
  Search,
  Pin,
  PinOff,
  Download,
  ImagePlus,
  Globe,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';
import BuilderView from '@/components/ai-builder/BuilderView';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const API = getApiUrl();

const suggestedPrompts = [
  { icon: Sparkles, label: 'Write a professional email', prompt: 'Help me write a professional email to a client about a project delay, keeping the tone apologetic yet confident.' },
  { icon: Code, label: 'Debug my code', prompt: 'I have a bug in my code. Can you help me debug it? Here is the error message:' },
  { icon: FileText, label: 'Summarize meeting notes', prompt: 'Summarize the following meeting notes into key decisions, action items, and next steps:' },
  { icon: Lightbulb, label: 'Brainstorm ideas', prompt: 'Help me brainstorm 10 creative ideas for improving team productivity in a remote work environment.' },
  { icon: BrainCircuit, label: 'Explain a concept', prompt: 'Explain the concept of machine learning in simple terms that a non-technical person would understand.' },
  { icon: FileText, label: 'Create a project plan', prompt: 'Create a detailed project plan for launching a new product feature, including milestones and timelines.' },
];

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);
  const codeStr = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group my-3">
        <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-1.5 rounded-t-lg border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
          <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: '13px' }}
          {...props}
        >
          {codeStr}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className="bg-gray-100 dark:bg-slate-700 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  );
}

function getStoredToken() {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    return session.token || null;
  } catch { return null; }
}

function AuthenticatedImage({ src, alt, className }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchImage = async () => {
      try {
        const tk = getStoredToken();
        if (!tk) return;
        const res = await fetch(src, { headers: { Authorization: `Bearer ${tk}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      } catch {
        if (!cancelled) setBlobUrl(null);
      }
    };
    if (src) fetchImage();
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  if (!blobUrl) {
    return (
      <div className={cn("flex items-center justify-center bg-gray-100 dark:bg-slate-700 animate-pulse", className)} style={{ minHeight: 120 }}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }
  return <img src={blobUrl} alt={alt} className={className} />;
}

function GeneratedFileDisplay({ file }) {
  const API_BASE = getApiUrl();
  const fileUrl = file.url?.startsWith('/') ? `${API_BASE}${file.url}` : file.url;

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const tk = getStoredToken();
      const res = await fetch(fileUrl, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (file.type === 'image') {
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 max-w-sm" data-testid="generated-image">
        <AuthenticatedImage src={fileUrl} alt={file.filename} className="w-full" />
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-800">
          <span className="text-xs text-gray-500 truncate">{file.filename}</span>
          <button onClick={handleDownload} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>
    );
  }

  const iconMap = { pdf: FileText, docx: FileText, xlsx: FileIcon };
  const colorMap = { pdf: 'text-red-500 bg-red-50 dark:bg-red-900/20', docx: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', xlsx: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' };
  const Icon = iconMap[file.type] || FileIcon;
  const color = colorMap[file.type] || 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 max-w-xs" data-testid={`generated-${file.type}`}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.filename}</p>
        <p className="text-[10px] text-gray-400 uppercase">{file.type} document</p>
      </div>
      <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" title="Download">
        <Download className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}

function SourceLinks({ sources }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700/50" data-testid="source-links">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Globe className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Sources</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((src, i) => (
          <a
            key={i}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-xs text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-700 dark:hover:text-violet-300 transition-all group"
            data-testid={`source-link-${i}`}
            title={src.url}
          >
            <span className="max-w-[180px] truncate">{src.title || new URL(src.url).hostname}</span>
            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

function ImageGenDialog({ open, onClose, onSubmit }) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPrompt('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit(`Generate an image of: ${prompt.trim()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose} data-testid="image-gen-dialog">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-md mx-4 p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <ImagePlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generate Image</h3>
            <p className="text-[11px] text-gray-400">Describe what you want to create</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="A sunset over mountains, a futuristic city, a cat wearing a hat..."
            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows={3}
            data-testid="image-gen-prompt"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim()}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                prompt.trim()
                  ? "bg-violet-600 hover:bg-violet-700 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed"
              )}
              data-testid="image-gen-submit"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ message, isLastAssistant, onRegenerate, isStreaming: isCurrentlyStreaming }) {
  const isUser = message.role === 'user';
  const [msgCopied, setMsgCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content || '');
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-3 px-4 py-4", isUser ? "justify-end" : "")} data-testid={`chat-message-${message.role}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <Bot className="w-4.5 h-4.5 text-white" />
        </div>
      )}
      <div className={cn("max-w-[75%] min-w-0", isUser ? "order-1" : "")}>
        {message.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300">
                {att.content_type?.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileIcon className="w-3.5 h-3.5" />}
                {att.filename}
              </div>
            ))}
          </div>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-violet-600 text-white rounded-br-sm"
            : "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-bl-sm shadow-sm"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.isThinking ? (
            <div className="flex items-center gap-2 py-1">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500">{message.statusText || 'Thinking...'}</span>
            </div>
          ) : message.isStreaming ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-0 prose-code:before:content-[''] prose-code:after:content-['']">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                {message.content || ''}
              </ReactMarkdown>
              <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 rounded-sm" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-0 prose-code:before:content-[''] prose-code:after:content-['']">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {/* Generated Files Display */}
          {message.generated_files?.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.generated_files.map((file, i) => (
                <GeneratedFileDisplay key={i} file={file} />
              ))}
            </div>
          )}
          {/* Source Links */}
          {!message.isThinking && !message.isStreaming && <SourceLinks sources={message.sources} />}
        </div>
        {/* Action buttons for assistant messages */}
        {!isUser && !message.isThinking && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-1.5 ml-1">
            <button
              onClick={handleCopyMessage}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Copy response"
              data-testid="copy-response-btn"
            >
              {msgCopied ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isLastAssistant && onRegenerate && !isCurrentlyStreaming && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-xs"
                title="Regenerate response"
                data-testid="regenerate-response-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4.5 h-4.5 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
}

export default function AIChatPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [token, setToken] = useState(null);
  const [builderMode, setBuilderMode] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [storageQuota, setStorageQuota] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [imageGenOpen, setImageGenOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);
  const streamingRef = useRef(false);

  // Helper to always get a valid auth token
  const getToken = useCallback(() => {
    if (token) return token;
    try {
      const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
      if (session.token) {
        setToken(session.token);
        return session.token;
      }
    } catch { /* ignore */ }
    return null;
  }, [token]);

  // Get token from session storage
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    try {
      const sessionJson = localStorage.getItem('munal_sessions');
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        if (session.token) {
          setToken(session.token);
          return;
        }
      }
    } catch { /* localStorage parse error */ }
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate, authLoading]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${API}/api/ai-chat/conversations`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) setConversations(await res.json());
    } catch (e) { console.error(e); }
  }, [getToken]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load storage quota
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/api/storage/my-quota`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStorageQuota(d))
      .catch(() => {});
  }, [messages.length]);

  // Load messages for active conversation (skip during streaming)
  useEffect(() => {
    if (streamingRef.current) return;
    const t = getToken();
    if (!activeConvId || !t) { setMessages([]); return; }
    setLoadingConv(true);
    fetch(`${API}/api/ai-chat/conversations/${activeConvId}`, {
      headers: { Authorization: `Bearer ${t}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!streamingRef.current) {
          // Map attachments with type/url to generated_files for display
          const msgs = (data.messages || []).map(m => ({
            ...m,
            generated_files: m.role === 'assistant' ? (m.attachments || []).filter(a => a.type) : [],
            sources: m.sources || []
          }));
          setMessages(msgs);
        }
        setLoadingConv(false);
      })
      .catch(() => setLoadingConv(false));
  }, [activeConvId, getToken]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search conversations (debounced backend search for message content)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const t = getToken();
    if (!t) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/ai-chat/conversations/search?q=${encodeURIComponent(searchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, getToken]);

  const createConversation = async () => {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${API}/api/ai-chat/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
      });
      const conv = await res.json();
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      setUploadedFiles([]);
      inputRef.current?.focus();
    } catch (e) { console.error(e); }
  };

  const deleteConversation = async (id) => {
    const t = getToken();
    if (!t) return;
    try {
      await fetch(`${API}/api/ai-chat/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` }
      });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
    } catch (e) { console.error(e); }
  };

  const renameConversation = async (id) => {
    const t = getToken();
    if (!editTitle.trim() || !t) return;
    try {
      await fetch(`${API}/api/ai-chat/conversations/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() })
      });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c));
      setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const togglePin = async (id) => {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${API}/api/ai-chat/conversations/${id}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();
      setConversations(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, pinned: data.pinned } : c);
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
      });
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (overrideText) => {
    const text = overrideText || input.trim();
    if (!text && uploadedFiles.length === 0) return;
    if (isStreaming) return;

    // Get token, with fallback to direct localStorage read
    let authToken = token;
    if (!authToken) {
      try {
        const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
        authToken = session.token;
        if (authToken) setToken(authToken);
      } catch { /* ignore */ }
    }
    if (!authToken) {
      navigate('/login');
      return;
    }

    let convId = activeConvId;
    if (!convId) {
      try {
        const res = await fetch(`${API}/api/ai-chat/conversations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }
        });
        const conv = await res.json();
        convId = conv.id;
        setConversations(prev => [conv, ...prev]);
        setActiveConvId(convId);
      } catch (e) { console.error(e); return; }
    }

    const userMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: text,
      attachments: uploadedFiles.map(f => ({ filename: f.original_filename, content_type: f.content_type, file_id: f.id })),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setUploadedFiles([]);
    setIsStreaming(true);
    streamingRef.current = true;

    const assistantMsg = { id: 'streaming', role: 'assistant', content: '', isThinking: true, isStreaming: false, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`${API}/api/ai-chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          attachments: uploadedFiles.map(f => ({ filename: f.original_filename, content_type: f.content_type, file_id: f.id })),
          web_search: webSearchEnabled
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Chat API error:', res.status, errText);
        throw new Error(`API returned ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No response body for streaming');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'thinking') {
              // Already showing thinking state, just keep it
            } else if (data.type === 'search_start') {
              // Web search detected — clear streamed content (was just the search tag)
              fullContent = '';
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = { ...last, content: '', isThinking: true, isStreaming: false, statusText: 'Searching the web...' };
                }
                return updated;
              });
            } else if (data.type === 'status') {
              // Show status messages like "Generating image..."
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = { ...last, statusText: data.content, isThinking: true, isStreaming: false };
                }
                return updated;
              });
            } else if (data.type === 'chunk') {
              fullContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = { ...last, content: fullContent, isThinking: false, isStreaming: true, statusText: null };
                }
                return updated;
              });
            } else if (data.type === 'done') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = {
                    ...last,
                    id: data.message_id,
                    isStreaming: false,
                    isThinking: false,
                    statusText: null,
                    generated_files: data.generated_files || [],
                    sources: data.sources || []
                  };
                }
                return updated;
              });
            }
          } catch { /* ignore SSE parse errors */ }
        }
      }

      // Update conversation title in sidebar
      loadConversations();
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.id === 'streaming') {
            updated[updated.length - 1] = { ...last, content: 'Sorry, something went wrong. Please try again.', isStreaming: false, isThinking: false };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsStreaming(false);
      streamingRef.current = false;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.isStreaming || last?.isThinking) updated[updated.length - 1] = { ...last, isStreaming: false, isThinking: false };
        return updated;
      });
    }
  };

  const regenerateResponse = async () => {
    if (isStreaming || !activeConvId) return;

    let authToken = token;
    if (!authToken) {
      try {
        const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
        authToken = session.token;
      } catch { /* ignore */ }
    }
    if (!authToken) return;

    // Find the last user message to re-send
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove the last assistant message from UI
    setMessages(prev => {
      const updated = [...prev];
      while (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated.pop();
      }
      return updated;
    });

    setIsStreaming(true);
    streamingRef.current = true;

    const assistantMsgId = 'streaming';
    const assistantMsg = { id: assistantMsgId, role: 'assistant', content: '', isThinking: true, isStreaming: false, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`${API}/api/ai-chat/conversations/${activeConvId}/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              fullContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = { ...last, content: fullContent, isThinking: false, isStreaming: true };
                }
                return updated;
              });
            } else if (data.type === 'done') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = { ...last, id: data.message_id, isStreaming: false, isThinking: false };
                }
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.id === 'streaming') {
            updated[updated.length - 1] = { ...last, content: 'Sorry, regeneration failed. Please try again.', isStreaming: false, isThinking: false };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
      abortRef.current = null;
    }
  };

  // Voice recording
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        try {
          const res = await fetch(`${API}/api/ai-chat/voice`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData
          });
          const data = await res.json();
          if (data.text) setInput(prev => prev + (prev ? ' ' : '') + data.text);
        } catch (e) { console.error('Transcription failed:', e); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) { console.error('Mic access denied:', e); }
  };

  // File upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${API}/api/ai-chat/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setUploadedFiles(prev => [...prev, data]);
        }
      } catch (e) { console.error('Upload failed:', e); }
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectPrompt = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportChat = async (format) => {
    const t = getToken();
    if (!t || !activeConvId) return;
    setExporting(true);
    setExportOpen(false);
    try {
      const res = await fetch(`${API}/api/ai-chat/conversations/${activeConvId}/export?format=${format}`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const ext = format === 'md' ? 'md' : format === 'pdf' ? 'pdf' : 'docx';
      const name = conversations.find(c => c.id === activeConvId)?.title || 'chat-export';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name.replace(/[^\w\s-]/g, '').substring(0, 60).trim()}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error('Export error:', e);
    }
    setExporting(false);
  };

  const isEmptyState = !activeConvId || messages.length === 0;

  // Show loading while auth is initializing
  if (authLoading || (!token && !isAuthenticated)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Builder Mode
  if (builderMode) {
    return <BuilderView onSwitchToChat={() => setBuilderMode(false)} />;
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-slate-950" data-testid="ai-chat-page">
      <Helmet><title>AI Chat - Munal AI</title></Helmet>

      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-all duration-300 h-full",
        sidebarOpen ? "w-72" : "w-0 overflow-hidden"
      )} data-testid="chat-sidebar">
        <div className="p-3 border-b border-gray-100 dark:border-slate-800">
          <button
            onClick={createConversation}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            data-testid="new-chat-btn"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </button>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              data-testid="conversation-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                data-testid="clear-search-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5" data-testid="conversation-list">
          {(() => {
            const displayConvs = searchResults !== null ? searchResults : conversations;
            if (displayConvs.length === 0 && searchQuery) {
              return <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8 px-4">No matching conversations found</p>;
            }
            return displayConvs.map(conv => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                activeConvId === conv.id
                  ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
              onClick={() => { setActiveConvId(conv.id); setUploadedFiles([]); }}
              data-testid={`conv-item-${conv.id}`}
            >
              {editingId === conv.id ? (
                <div className="flex-1 flex items-center gap-1">
                  <input
                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && renameConversation(conv.id)}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); renameConversation(conv.id); }} className="p-0.5 text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-0.5 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <>
                  {conv.pinned && <Pin className="w-3 h-3 text-violet-500 flex-shrink-0 rotate-45" />}
                  <span className="flex-1 truncate">{conv.title}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                      className={cn("p-1 rounded", conv.pinned ? "text-violet-500 hover:text-violet-600" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200")}
                      title={conv.pinned ? "Unpin" : "Pin"}
                      data-testid={`pin-conv-${conv.id}`}
                    >
                      {conv.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"><Pencil className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </>
              )}
            </div>
          ));
          })()}
          {conversations.length === 0 && !searchQuery && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8 px-4">No conversations yet. Start a new chat!</p>
          )}
        </div>
        <div className="p-3 border-t border-gray-100 dark:border-slate-800 text-center">
          <span className="text-[10px] text-gray-400 dark:text-gray-600">Powered by GPT-5.2</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <a href="/dashboard" className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity" data-testid="chat-logo-link">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white hidden sm:inline">Munal</span>
          </a>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" data-testid="toggle-sidebar">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Munal AI Assistant</h2>
              <p className="text-[10px] text-gray-400">GPT-5.2 · Always ready</p>
            </div>
          </div>
          <button onClick={() => setBuilderMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors cursor-pointer" data-testid="ai-builder-badge">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400 hidden sm:inline">AI Builder</span>
          </button>
          <ThemeSwitcher />
          {/* Export Button */}
          {activeConvId && messages.length > 0 && (
            <div className="ml-auto relative" ref={exportRef}>
              <button
                onClick={() => setExportOpen(!exportOpen)}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="export-chat-btn"
                title="Export conversation"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">Export</span>
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50" data-testid="export-dropdown">
                  <button
                    onClick={() => exportChat('md')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    data-testid="export-md-btn"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => exportChat('pdf')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    data-testid="export-pdf-btn"
                  >
                    <FileText className="w-4 h-4 text-red-400" />
                    PDF (.pdf)
                  </button>
                  <button
                    onClick={() => exportChat('docx')}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    data-testid="export-docx-btn"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    Word (.docx)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages or Empty State */}
        <div className="flex-1 overflow-y-auto" data-testid="chat-messages-area">
          {isEmptyState && !loadingConv ? (
            <div className="flex flex-col items-center justify-center h-full px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                <Bot className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-testid="empty-state-title">How can I help you today?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
                Ask me anything — from writing code and emails to brainstorming ideas and analyzing data.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl w-full">
                {suggestedPrompts.map((sp, i) => (
                  <button
                    key={i}
                    onClick={() => selectPrompt(sp.prompt)}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all text-left group"
                    data-testid={`suggested-prompt-${i}`}
                  >
                    <sp.icon className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{sp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : loadingConv ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-4">
              {messages.map((msg, i) => {
                const lastAssistantIdx = messages.reduce((acc, m, idx) => m.role === 'assistant' ? idx : acc, -1);
                return (
                  <ChatMessage
                    key={msg.id || i}
                    message={msg}
                    isLastAssistant={msg.role === 'assistant' && i === lastAssistantIdx}
                    onRegenerate={regenerateResponse}
                    isStreaming={isStreaming}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          {/* Uploaded files preview */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300">
                  {f.content_type?.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileIcon className="w-3.5 h-3.5" />}
                  <span className="max-w-[120px] truncate">{f.original_filename}</span>
                  <button onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="max-w-4xl mx-auto flex items-end gap-2">
            {/* Storage quota indicator */}
            {storageQuota && storageQuota.usage_pct > 0 && (
              <div className="absolute -top-6 left-0 right-0 max-w-4xl mx-auto flex items-center gap-2 px-1" data-testid="quota-indicator">
                <div className="flex-1 h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', storageQuota.usage_pct > 90 ? 'bg-red-500' : storageQuota.usage_pct > 70 ? 'bg-amber-500' : 'bg-violet-500')} style={{ width: `${Math.min(storageQuota.usage_pct, 100)}%` }} />
                </div>
                <span className={cn('text-[10px] shrink-0', storageQuota.usage_pct > 90 ? 'text-red-500 font-medium' : 'text-gray-400')}>
                  {storageQuota.used_formatted} / {storageQuota.limit_formatted}
                </span>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} accept="image/*,.pdf,.txt,.csv,.json,.md,.py,.js,.ts,.jsx,.tsx,.html,.css,.doc,.docx,.xls,.xlsx" />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              data-testid="file-upload-btn"
              title="Upload file"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleRecording}
              className={cn(
                "p-2.5 rounded-xl transition-colors flex-shrink-0",
                isRecording
                  ? "bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
              data-testid="voice-input-btn"
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setImageGenOpen(true)}
              className="p-2.5 rounded-xl text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors flex-shrink-0"
              data-testid="image-gen-btn"
              title="Generate image"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            <button
              onClick={() => setWebSearchEnabled(prev => !prev)}
              className={cn(
                "p-2.5 rounded-xl transition-all flex-shrink-0 relative",
                webSearchEnabled
                  ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
              data-testid="web-search-toggle"
              title={webSearchEnabled ? "Web search: ON — AI will search the web when needed" : "Web search: OFF — AI answers from knowledge only"}
            >
              <Globe className="w-5 h-5" />
              {webSearchEnabled && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Munal AI..."
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow min-h-[48px] max-h-[200px]"
                rows={1}
                style={{ height: 'auto', minHeight: '48px' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'; }}
                data-testid="chat-input"
              />
            </div>

            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0"
                data-testid="stop-btn"
                title="Stop generating"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() && uploadedFiles.length === 0}
                className={cn(
                  "p-2.5 rounded-xl transition-colors flex-shrink-0",
                  input.trim() || uploadedFiles.length > 0
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                )}
                data-testid="send-btn"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-2">
            Munal AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      {/* Image Generation Dialog */}
      <ImageGenDialog
        open={imageGenOpen}
        onClose={() => setImageGenOpen(false)}
        onSubmit={(prompt) => {
          setInput(prompt);
          setTimeout(() => sendMessage(prompt), 100);
        }}
      />
    </div>
  );
}
