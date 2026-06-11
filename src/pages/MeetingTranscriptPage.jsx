import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowLeft, FileText, Lightbulb, ListTodo, Target, Calendar,
  MessageSquare, TrendingUp, Users, Clock, Download, Search,
  ChevronDown, ChevronUp, AlertTriangle, Loader2, FileSpreadsheet,
  CheckCircle2, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/PageTransition';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  return <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium capitalize', colors[priority] || colors.medium)}>{priority}</span>;
};

const SentimentBadge = ({ sentiment }) => {
  const map = {
    positive: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
    neutral: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: MessageSquare },
    mixed: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
    negative: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
  };
  const s = map[sentiment] || map.neutral;
  const Icon = s.icon;
  return <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize', s.color)}><Icon className="w-3.5 h-3.5" />{sentiment}</span>;
};

const formatDuration = (seconds) => {
  if (!seconds) return 'N/A';
  const m = Math.floor(seconds / 60);
  return m > 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

const formatTimestamp = (seconds) => {
  if (seconds == null) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const MeetingTranscriptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingToSheet, setSendingToSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    transcript: true, actions: true, decisions: true, topics: true, followups: true
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/ai/meeting/${id}/status`);
        if (res.ok) setMeeting(await res.json());
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const handleExport = async (format) => {
    try {
      const res = await fetch(`${API_URL}/api/ai/meeting/${id}/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `transcript.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: `${format.toUpperCase()} downloaded` });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleSendToSheet = async () => {
    setSendingToSheet(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/sheets/from-meeting/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Failed');
      const sheet = await res.json();
      toast({ title: 'Sheet created', description: `"${sheet.title}" is ready in DocHub` });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSendingToSheet(false);
  };

  const handleCopyTranscript = () => {
    const text = meeting?.transcript?.text || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggle = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!meeting || meeting.status !== 'completed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {!meeting ? 'Transcript Not Found' : 'Transcript Still Processing'}
        </h2>
        <p className="text-gray-500 mb-4">
          {!meeting ? 'This meeting transcript does not exist.' : `Status: ${meeting.status}`}
        </p>
        <Button onClick={() => navigate('/meetings')}>Back to Meetings</Button>
      </div>
    );
  }

  const { insights, transcript, participants, duration_seconds, title, created_at } = meeting;
  const segments = transcript?.segments || [];
  const transcriptText = transcript?.text || '';

  // Search highlight
  const highlightText = (text) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === searchTerm.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{p}</mark>
        : p
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950" data-testid="meeting-transcript-page">
        <Helmet><title>{title} - Transcript | Munal AI</title></Helmet>

        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')} className="gap-1 shrink-0">
                <ArrowLeft className="w-4 h-4" /> Meetings
              </Button>
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate" data-testid="transcript-title">{title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="gap-1 text-xs" data-testid="export-pdf-btn">
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('docx')} className="gap-1 text-xs" data-testid="export-docx-btn">
                <Download className="w-3.5 h-3.5" /> DOCX
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendToSheet} disabled={sendingToSheet} className="gap-1 text-xs" data-testid="send-to-sheet-btn">
                {sendingToSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} Sheet
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Meta Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400" data-testid="transcript-meta">
            {created_at && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
            {duration_seconds > 0 && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDuration(duration_seconds)}</span>}
            {participants?.length > 0 && <span className="flex items-center gap-1"><Users className="w-4 h-4" />{participants.join(', ')}</span>}
            {insights?.sentiment && <SentimentBadge sentiment={insights.sentiment} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Transcript */}
            <div className="lg:col-span-2 space-y-4">
              {/* Summary */}
              {insights?.summary && (
                <Card data-testid="transcript-summary-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-violet-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Summary</h3>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insights.summary}</p>
                    {insights.participation_notes && (
                      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><Users className="w-3 h-3" />{insights.participation_notes}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Full Transcript */}
              <Card data-testid="full-transcript-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Full Transcript</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyTranscript} className="gap-1 text-xs">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search transcript..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 text-sm"
                      data-testid="transcript-search"
                    />
                  </div>
                  {segments.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {segments.map((seg, i) => (
                        <div key={i} className="flex gap-3 group" data-testid={`segment-${i}`}>
                          <span className="text-[10px] text-gray-400 font-mono pt-0.5 w-10 shrink-0 text-right">
                            {formatTimestamp(seg.start)}
                          </span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                            {highlightText(seg.text)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : transcriptText ? (
                    <div className="max-h-[600px] overflow-y-auto pr-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {highlightText(transcriptText)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No transcript text available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Insights Sidebar */}
            <div className="space-y-4">
              {/* Action Items */}
              {insights?.action_items?.length > 0 && (
                <Card data-testid="action-items-panel">
                  <CardContent className="p-4">
                    <button onClick={() => toggle('actions')} className="w-full flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Action Items ({insights.action_items.length})</h3>
                      </div>
                      {expandedSections.actions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.actions && (
                      <div className="space-y-2">
                        {insights.action_items.map((item, i) => (
                          <div key={i} className="p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-gray-800 dark:text-gray-200">{item.task}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{item.assignee}</span>
                              <PriorityBadge priority={item.priority} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Key Decisions */}
              {insights?.key_decisions?.length > 0 && (
                <Card data-testid="decisions-panel">
                  <CardContent className="p-4">
                    <button onClick={() => toggle('decisions')} className="w-full flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Key Decisions ({insights.key_decisions.length})</h3>
                      </div>
                      {expandedSections.decisions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.decisions && (
                      <div className="space-y-2">
                        {insights.key_decisions.map((d, i) => (
                          <div key={i} className="p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{d.decision}</p>
                            {d.context && <p className="text-xs text-gray-500 mt-1">{d.context}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Topics */}
              {insights?.topics_discussed?.length > 0 && (
                <Card data-testid="topics-panel">
                  <CardContent className="p-4">
                    <button onClick={() => toggle('topics')} className="w-full flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Topics ({insights.topics_discussed.length})</h3>
                      </div>
                      {expandedSections.topics ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.topics && (
                      <div className="space-y-2">
                        {insights.topics_discussed.map((t, i) => (
                          <div key={i} className="p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.topic}</p>
                            {t.key_points?.map((p, j) => (
                              <p key={j} className="text-xs text-gray-500 mt-0.5 pl-2 border-l-2 border-blue-200">{p}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Follow-ups */}
              {insights?.follow_ups?.length > 0 && (
                <Card data-testid="followups-panel">
                  <CardContent className="p-4">
                    <button onClick={() => toggle('followups')} className="w-full flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Follow-ups ({insights.follow_ups.length})</h3>
                      </div>
                      {expandedSections.followups ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expandedSections.followups && (
                      <div className="space-y-2">
                        {insights.follow_ups.map((f, i) => (
                          <div key={i} className="flex items-start justify-between p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{f.item}</p>
                            {f.due && <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{f.due}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default MeetingTranscriptPage;
