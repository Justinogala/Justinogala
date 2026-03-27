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
  StopCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api';

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

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

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
        </div>
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
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

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

  // Load messages for active conversation
  useEffect(() => {
    const t = getToken();
    if (!activeConvId || !t) { setMessages([]); return; }
    setLoadingConv(true);
    fetch(`${API}/api/ai-chat/conversations/${activeConvId}`, {
      headers: { Authorization: `Bearer ${t}` }
    })
      .then(r => r.json())
      .then(data => { setMessages(data.messages || []); setLoadingConv(false); })
      .catch(() => setLoadingConv(false));
  }, [activeConvId, getToken]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const sendMessage = async () => {
    const text = input.trim();
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

    const assistantMsg = { id: 'streaming', role: 'assistant', content: '', isStreaming: true, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(`${API}/api/ai-chat/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          attachments: uploadedFiles.map(f => ({ filename: f.original_filename, content_type: f.content_type, file_id: f.id }))
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
            if (data.type === 'chunk') {
              fullContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = { ...last, content: fullContent };
                }
                return updated;
              });
            } else if (data.type === 'done') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === 'streaming') {
                  updated[updated.length - 1] = { ...last, id: data.message_id, isStreaming: false };
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
            updated[updated.length - 1] = { ...last, content: 'Sorry, something went wrong. Please try again.', isStreaming: false };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsStreaming(false);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.isStreaming) updated[updated.length - 1] = { ...last, isStreaming: false };
        return updated;
      });
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

  const isEmptyState = !activeConvId || messages.length === 0;

  // Show loading while auth is initializing
  if (authLoading || (!token && !isAuthenticated)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
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
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5" data-testid="conversation-list">
          {conversations.map(conv => (
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
                  <span className="flex-1 truncate">{conv.title}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"><Pencil className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {conversations.length === 0 && (
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
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id || i} message={msg} />
              ))}
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
                onClick={sendMessage}
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
    </div>
  );
}
