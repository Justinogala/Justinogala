import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_BASE = window.location.origin;

const AiTutor = ({ courseId, lessonId, lessonTitle, courseTitle, token, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !historyLoaded && token) {
      const params = new URLSearchParams({ limit: '20' });
      if (lessonId) params.set('lesson_id', lessonId);
      fetch(`${API_BASE}/api/academy/courses/${courseId}/ai-tutor/history?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : { messages: [] })
        .then(d => {
          setMessages(d.messages || []);
          setHistoryLoaded(true);
        });
    }
  }, [isOpen, courseId, lessonId, token, historyLoaded]);

  useEffect(() => {
    setHistoryLoaded(false);
    setMessages([]);
  }, [lessonId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, id: Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/ai-tutor`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, lesson_id: lessonId, lesson_title: lessonTitle, course_title: courseTitle }),
      });
      if (res.ok) {
        const d = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: d.response, id: Date.now() + 1 }]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800" data-testid="ai-tutor-panel">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">AI Tutor</h3>
          <p className="text-[11px] text-white/70 truncate">{lessonTitle || courseTitle}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-violet-500" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Ask me anything</h4>
            <p className="text-xs text-gray-400 max-w-[240px] mx-auto">I can explain concepts, answer questions, and help you understand this lesson better.</p>
            <div className="mt-4 space-y-2">
              {['Explain the key concepts', 'Give me a real-world example', 'What should I focus on?'].map(q => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="block w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={cn("flex gap-2.5", msg.role === 'user' ? "justify-end" : "justify-start")}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-violet-600" />
              </div>
            )}
            <div className={cn("max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === 'user'
                ? "bg-violet-600 text-white rounded-br-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about this lesson..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            disabled={loading}
            data-testid="ai-tutor-input"
          />
          <Button onClick={sendMessage} disabled={!input.trim() || loading} size="icon" className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-700 shrink-0" data-testid="ai-tutor-send">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
