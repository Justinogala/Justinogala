import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Search, FileText, Mail, Calendar, BarChart3, Brain, Sparkles, Loader2,
  Send, Download, ChevronRight, Clock, Users, CheckCircle2, X, ArrowRight,
  MessageSquare, File, Table2, Mic, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const RateLimitBanner = () => (
  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm mb-3">
    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
    <span className="text-amber-700 dark:text-amber-400">AI is temporarily rate-limited. Results shown are from your data. Go to <strong>Profile &rarr; Universal Key &rarr; Add Balance</strong> for full AI capabilities.</span>
  </div>
);

/* ─── AI Smart Search ─── */
const SmartSearchSection = ({ userId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-features/smart-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_id: userId })
      });
      const data = await res.json();
      if (data.success) setResults(data);
      else toast({ description: 'Search failed', variant: 'destructive' });
    } catch { toast({ description: 'Search error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const typeIcons = { transcripts: Mic, documents: FileText, sheets: Table2, meetings: Calendar, messages: MessageSquare };

  return (
    <div data-testid="smart-search-section">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            data-testid="smart-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Ask anything — "What did John say about the budget?"'
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
          />
        </div>
        <Button data-testid="smart-search-btn" type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 rounded-xl px-5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>
      {results && (
        <div className="space-y-3" data-testid="smart-search-results">
          {!results.ai_answer && results.total_results > 0 && <RateLimitBanner />}
          {results.ai_answer && (
            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-xs font-medium mb-1">
                <Sparkles className="w-3 h-3" /> AI Answer
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{results.ai_answer}</p>
            </div>
          )}
          {Object.entries(typeIcons).map(([key, Icon]) => {
            const items = results[key] || [];
            if (!items.length) return null;
            return (
              <div key={key}>
                <div className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Icon className="w-3 h-3" /> {key} ({items.length})
                </div>
                {items.map((item, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 mb-1 text-sm">
                    <span className="font-medium">{item.title || item.name || item.original_filename || item.content?.slice(0, 80)}</span>
                    {item.created_at && <span className="text-xs text-slate-400 ml-2">{item.created_at?.slice(0, 10)}</span>}
                  </div>
                ))}
              </div>
            );
          })}
          <p className="text-xs text-slate-400 text-right">{results.total_results} results found</p>
        </div>
      )}
    </div>
  );
};

/* ─── Document Summarizer ─── */
const DocSummarizerSection = () => {
  const [docId, setDocId] = useState('');
  const [mode, setMode] = useState('summary');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/pdf-editor/documents`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setDocs(d);
      else if (d.documents) setDocs(d.documents);
    }).catch(() => {});
  }, []);

  const handleSummarize = async () => {
    if (!docId) { toast({ description: 'Select a document', variant: 'destructive' }); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ai-features/document/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docId, mode, question: mode === 'qa' ? question : undefined })
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else toast({ description: data.detail || 'Summarization failed', variant: 'destructive' });
    } catch { toast({ description: 'Error summarizing document', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="doc-summarizer-section" className="space-y-3">
      <select
        data-testid="doc-select"
        value={docId}
        onChange={e => setDocId(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
      >
        <option value="">Select a document...</option>
        {docs.map(d => <option key={d.id} value={d.id}>{d.name || d.original_filename || d.id}</option>)}
      </select>
      <div className="flex gap-2">
        {['summary', 'key_points', 'qa'].map(m => (
          <button key={m} onClick={() => setMode(m)} data-testid={`mode-${m}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === m ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
            {m === 'summary' ? 'Summary' : m === 'key_points' ? 'Key Points' : 'Q&A'}
          </button>
        ))}
      </div>
      {mode === 'qa' && (
        <input data-testid="qa-input" value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question about this document..."
          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
      )}
      <Button data-testid="summarize-btn" onClick={handleSummarize} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</> : <><Brain className="w-4 h-4 mr-2" /> Analyze Document</>}
      </Button>
      {result && (
        <div data-testid="doc-result" className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {result.rate_limited && <RateLimitBanner />}
          {result.mode === 'summary' && (
            <><h4 className="text-sm font-semibold mb-2">Summary — {result.document_title}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{result.summary}</p>
            <p className="text-xs text-slate-400 mt-2">{result.word_count} words analyzed</p></>
          )}
          {result.mode === 'key_points' && (
            <><h4 className="text-sm font-semibold mb-2">Key Points</h4>
            <ul className="space-y-1">{result.key_points?.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-green-500 shrink-0" /><span>{p}</span></li>
            ))}</ul></>
          )}
          {result.mode === 'qa' && (
            <><h4 className="text-sm font-semibold mb-1">Q: {result.question}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">{result.answer}</p></>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Meeting Summary Emails ─── */
const MeetingSummaryEmailSection = ({ userId }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/ai/meeting/user/${userId}`).then(r => r.json()).then(d => {
      setTranscripts(d.meetings || []);
    }).catch(() => {});
  }, [userId]);

  const handleSend = async () => {
    if (!selectedId) { toast({ description: 'Select a meeting', variant: 'destructive' }); return; }
    setLoading(true);
    setSent(null);
    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
      const res = await fetch(`${API_URL}/api/ai-features/meeting/${selectedId}/send-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: selectedId, recipient_emails: emailList })
      });
      const data = await res.json();
      if (data.success) {
        setSent(data);
        toast({ description: `Summary sent to ${data.total_sent} recipients!` });
      } else toast({ description: data.detail || 'Send failed', variant: 'destructive' });
    } catch { toast({ description: 'Error sending email', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="meeting-email-section" className="space-y-3">
      <select data-testid="meeting-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
        <option value="">Select a meeting transcript...</option>
        {transcripts.map(t => <option key={t.id} value={t.id}>{t.title} ({t.created_at?.slice(0, 10)})</option>)}
      </select>
      <input data-testid="email-recipients" value={emails} onChange={e => setEmails(e.target.value)}
        placeholder="Recipient emails (comma-separated, or leave blank for all participants)"
        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
      <Button data-testid="send-summary-btn" onClick={handleSend} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</> : <><Mail className="w-4 h-4 mr-2" /> Send Summary Email</>}
      </Button>
      {sent && (
        <div data-testid="email-sent-result" className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm">
          <p className="text-green-700 dark:text-green-400 font-medium">Sent to {sent.total_sent} recipient(s)</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">{sent.sent_to?.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

/* ─── Agenda Generator ─── */
const AgendaGeneratorSection = ({ userId }) => {
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [date, setDate] = useState('');
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setAgenda(null);
    try {
      const res = await fetch(`${API_URL}/api/ai-features/meeting/generate-agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          meeting_title: title || 'Team Meeting',
          participant_names: participants.split(',').map(p => p.trim()).filter(Boolean),
          meeting_date: date
        })
      });
      const data = await res.json();
      if (data.success) {
        setAgenda(data);
        if (data.rate_limited) toast({ description: 'AI rate-limited — showing basic agenda template' });
        else toast({ description: 'Agenda generated!' });
      } else toast({ description: data.detail || 'Generation failed', variant: 'destructive' });
    } catch { toast({ description: 'Error generating agenda', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const typeColors = { opening: 'bg-blue-100 text-blue-700', discussion: 'bg-violet-100 text-violet-700', review: 'bg-amber-100 text-amber-700', action: 'bg-green-100 text-green-700', closing: 'bg-slate-100 text-slate-700' };

  return (
    <div data-testid="agenda-generator-section" className="space-y-3">
      <input data-testid="agenda-title" value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Meeting title (e.g., Q2 Strategy Review)"
        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
      <div className="flex gap-2">
        <input data-testid="agenda-participants" value={participants} onChange={e => setParticipants(e.target.value)}
          placeholder="Participants (comma-separated)"
          className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
        <input data-testid="agenda-date" type="date" value={date} onChange={e => setDate(e.target.value)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
      </div>
      <Button data-testid="generate-agenda-btn" onClick={handleGenerate} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><Calendar className="w-4 h-4 mr-2" /> Generate AI Agenda</>}
      </Button>
      {agenda && agenda.agenda && (
        <div data-testid="agenda-result" className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
          {agenda.rate_limited && <RateLimitBanner />}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{agenda.agenda.agenda_title}</h4>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{agenda.agenda.estimated_duration}</span>
          </div>
          <div className="space-y-2">
            {agenda.agenda.items?.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white dark:bg-slate-900">
                <span className="text-xs font-bold text-slate-400 mt-0.5 w-5">{item.order}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.topic}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeColors[item.type] || typeColors.discussion}`}>{item.type}</span>
                    <span className="text-xs text-slate-400">{item.duration}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          {agenda.agenda.notes && <p className="text-xs text-slate-500 italic">{agenda.agenda.notes}</p>}
          <div className="flex gap-3 text-xs text-slate-400">
            <span>Past meetings analyzed: {agenda.context_used?.past_meetings_analyzed}</span>
            <span>Open actions: {agenda.context_used?.open_action_items}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Weekly Digest ─── */
const WeeklyDigestSection = ({ userId }) => {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-features/weekly-digest/preview/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDigest(data);
        else toast({ description: 'No activity found this week' });
      } else toast({ description: 'No activity found this week for digest' });
    } catch { toast({ description: 'Error loading digest', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-features/weekly-digest/send/${userId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) toast({ description: `Digest sent to ${data.sent_to}` });
      else toast({ description: data.message || 'Send failed', variant: 'destructive' });
    } catch { toast({ description: 'Error sending digest', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div data-testid="weekly-digest-section" className="space-y-3">
      <div className="flex gap-2">
        <Button data-testid="preview-digest-btn" onClick={handlePreview} disabled={loading} variant="outline" className="flex-1 rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />} Preview Digest
        </Button>
        <Button data-testid="send-digest-btn" onClick={handleSend} disabled={sending} className="flex-1 bg-violet-600 hover:bg-violet-700 rounded-xl">
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Send Now
        </Button>
      </div>
      {digest && (
        <div data-testid="digest-preview" className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-center">
            <h4 className="text-white font-semibold text-sm">Your Weekly AI Digest</h4>
            <p className="text-violet-200 text-xs mt-1">{digest.week_label}</p>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{digest.ai_summary}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Meetings', value: digest.stats?.meetings_count, color: 'text-violet-600' },
                { label: 'Action Items', value: digest.stats?.action_items_count, color: 'text-green-600' },
                { label: 'Decisions', value: digest.stats?.decisions_count, color: 'text-red-600' },
              ].map((s, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value || 0}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{s.label}</div>
                </div>
              ))}
            </div>
            {digest.meeting_highlights?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Meeting Highlights</h5>
                {digest.meeting_highlights.map((m, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 mb-1">
                    <div className="text-sm font-medium">{m.title} <span className="text-xs text-slate-400">({m.date})</span></div>
                    <p className="text-xs text-slate-500 mt-0.5">{m.summary}</p>
                  </div>
                ))}
              </div>
            )}
            {digest.upcoming_events?.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Coming Up</h5>
                {digest.upcoming_events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1">
                    <Calendar className="w-3 h-3 text-violet-500" />
                    <span>{e.title}</span>
                    <span className="text-xs text-slate-400">{e.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── MAIN PAGE ─── */
export default function AIFeaturesPage() {
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState('search');

  const features = [
    { id: 'search', icon: Search, label: 'AI Smart Search', desc: 'Search across everything with natural language', color: 'from-blue-500 to-cyan-500' },
    { id: 'summarizer', icon: FileText, label: 'Document Summarizer', desc: 'Instant AI summaries of any document', color: 'from-emerald-500 to-teal-500' },
    { id: 'email', icon: Mail, label: 'Meeting Summary Email', desc: 'Email AI summaries to all participants', color: 'from-rose-500 to-pink-500' },
    { id: 'agenda', icon: Calendar, label: 'AI Meeting Agenda', desc: 'Auto-generate agendas from past meetings', color: 'from-amber-500 to-orange-500' },
    { id: 'digest', icon: BarChart3, label: 'Weekly AI Digest', desc: 'Personalized weekly summary of your work', color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div data-testid="ai-features-page" className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Features</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-12">Supercharge your workflow with AI-powered tools</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {features.map(f => (
            <button key={f.id} onClick={() => setActiveFeature(f.id)} data-testid={`feature-tab-${f.id}`}
              className={`p-3 rounded-xl text-left transition-all ${activeFeature === f.id
                ? 'bg-white dark:bg-slate-800 shadow-lg ring-2 ring-violet-500/50'
                : 'bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow'}`}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center mb-2`}>
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">{f.label}</div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{f.desc}</div>
            </button>
          ))}
        </div>

        {/* Active feature panel */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            {features.find(f => f.id === activeFeature) && (() => {
              const f = features.find(f2 => f2.id === activeFeature);
              return (<>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${f.color}`}><f.icon className="w-4 h-4 text-white" /></div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{f.label}</h2>
              </>);
            })()}
          </div>

          {activeFeature === 'search' && <SmartSearchSection userId={user?.id} />}
          {activeFeature === 'summarizer' && <DocSummarizerSection />}
          {activeFeature === 'email' && <MeetingSummaryEmailSection userId={user?.id} />}
          {activeFeature === 'agenda' && <AgendaGeneratorSection userId={user?.id} />}
          {activeFeature === 'digest' && <WeeklyDigestSection userId={user?.id} />}
        </div>
      </div>
    </div>
  );
}
