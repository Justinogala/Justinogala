import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, X, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';

const getToken = () => {
  try {
    const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
    return session.token || null;
  } catch { return null; }
};

const SheetChatPanel = ({ sheetId, sheetData, isOpen, onToggle }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const buildDataSummary = () => {
    if (!sheetData || !sheetData[0]) return '';
    const celldata = sheetData[0].celldata || [];
    const rows = {};
    for (const cell of celldata) {
      const r = cell.r, c = cell.c;
      const v = cell.v;
      const val = v?.m || v?.v || '';
      if (val) rows[r] = rows[r] || {}, rows[r][c] = String(val);
    }
    const maxCol = Math.max(...Object.values(rows).flatMap(r => Object.keys(r).map(Number)), 0);
    const lines = [];
    const sortedRows = Object.keys(rows).map(Number).sort((a, b) => a - b).slice(0, 30);
    for (const rIdx of sortedRows) {
      const vals = Array.from({ length: maxCol + 1 }, (_, c) => rows[rIdx]?.[c] || '');
      const prefix = rIdx === 0 ? 'HEADER: ' : `Row ${rIdx}: `;
      lines.push(prefix + vals.join(' | '));
    }
    return lines.join('\n');
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/sheets/${sheetId}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, sheet_data_summary: buildDataSummary() }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.' }]);
    }
    setLoading(false);
  };

  const suggestions = [
    'What is the total of all numeric values?',
    'Summarize the key data points',
    'Which row has the highest value?',
    'Are there any anomalies in this data?',
  ];

  if (!isOpen) return null;

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 transition-all",
      minimized ? "w-12" : "w-80"
    )} data-testid="sheet-chat-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
        {!minimized && (
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium text-violet-900 dark:text-violet-200">Chat with Data</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(!minimized)} className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 text-gray-500" data-testid="chat-minimize-btn">
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          {!minimized && (
            <button onClick={onToggle} className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 text-gray-500" data-testid="chat-close-btn">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {minimized ? (
        <div className="flex-1 flex items-center justify-center">
          <button onClick={() => setMinimized(false)} className="p-2 text-violet-500">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" data-testid="chat-messages">
            {messages.length === 0 && (
              <div className="text-center pt-6">
                <Sparkles className="w-8 h-8 mx-auto text-violet-300 dark:text-violet-600 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Ask anything about your spreadsheet data</p>
                <div className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="block w-full text-left px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      data-testid={`chat-suggestion-${i}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[90%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap",
                  msg.role === 'user'
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                )} data-testid={`chat-msg-${i}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-xl rounded-bl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about your data..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                disabled={loading}
                data-testid="chat-input"
              />
              <Button size="sm" onClick={sendMessage} disabled={!input.trim() || loading} className="px-2.5 bg-violet-600 hover:bg-violet-700" data-testid="chat-send-btn">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SheetChatPanel;
