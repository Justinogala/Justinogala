import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2, CheckCircle2, FileText, Lightbulb, ListTodo,
  MessageSquare, TrendingUp, ArrowLeft, Clock, Users,
  AlertTriangle, ChevronDown, ChevronUp, Target, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';

const STEPS = [
  { key: 'uploading', label: 'Uploading audio...', icon: Loader2 },
  { key: 'transcribing', label: 'Transcribing with AI...', icon: FileText },
  { key: 'generating_insights', label: 'Generating insights...', icon: Lightbulb },
  { key: 'completed', label: 'Complete!', icon: CheckCircle2 },
];

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
    positive: { color: 'bg-emerald-100 text-emerald-700', icon: TrendingUp },
    neutral: { color: 'bg-gray-100 text-gray-700', icon: MessageSquare },
    mixed: { color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    negative: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };
  const s = map[sentiment] || map.neutral;
  const Icon = s.icon;
  return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize', s.color)}><Icon className="w-3 h-3" />{sentiment}</span>;
};

const MeetingProcessingPage = () => {
  const { meetingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('uploading');
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({ transcript: false, topics: true, actions: true, decisions: true });
  const uploadedRef = useRef(false);

  const title = searchParams.get('title') || `Meeting ${meetingId?.slice(0, 8)}`;

  // Upload and process
  useEffect(() => {
    if (uploadedRef.current) return;
    const audioBlob = window.__meetingAudioBlob;
    const audioMeta = window.__meetingAudioMeta || {};
    if (!audioBlob || !meetingId) {
      // No audio — try polling for status (already processing)
      pollStatus();
      return;
    }
    uploadedRef.current = true;

    const process = async () => {
      setStatus('uploading');
      try {
        const formData = new FormData();
        const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
        formData.append('file', audioBlob, `meeting-${meetingId}.${ext}`);
        formData.append('meeting_id', meetingId);
        formData.append('user_id', audioMeta.userId || '');
        formData.append('meeting_title', audioMeta.title || title);
        formData.append('participants', (audioMeta.participants || []).join(','));
        formData.append('duration_seconds', String(audioMeta.durationSeconds || 0));

        setStatus('transcribing');

        const res = await fetch(`${API_URL}/api/ai/meeting/process`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Processing failed');
        }

        const data = await res.json();
        setMeeting(data);
        setStatus('completed');
      } catch (e) {
        console.error('Processing error:', e);
        setError(e.message);
        setStatus('failed');
      } finally {
        // Clean up global blob
        window.__meetingAudioBlob = null;
        window.__meetingAudioMeta = null;
      }
    };
    process();
  }, [meetingId]);

  const pollStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai/meeting/${meetingId}/status`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setStatus(data.status);
        if (data.status !== 'completed' && data.status !== 'failed') {
          setTimeout(pollStatus, 3000);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const insights = meeting?.insights;
  const transcript = meeting?.transcript;
  const isProcessing = ['uploading', 'transcribing', 'generating_insights'].includes(status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950" data-testid="meeting-processing-page">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Meetings
            </Button>
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
          </div>
          {status === 'completed' && (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Processed
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Processing Steps */}
        {isProcessing && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-8" data-testid="processing-indicator">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Processing Your Meeting</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI is analyzing your meeting audio</p>
            </div>
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
              {STEPS.filter(s => s.key !== 'completed').map((step, i) => {
                const isCurrent = step.key === status;
                const isDone = STEPS.findIndex(s => s.key === status) > i;
                return (
                  <React.Fragment key={step.key}>
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg transition-all", isCurrent && "bg-violet-50 dark:bg-violet-900/20", isDone && "opacity-60")}>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                      )}
                      <span className={cn("text-xs font-medium", isCurrent ? "text-violet-700 dark:text-violet-300" : "text-gray-500 dark:text-gray-400")}>{step.label}</span>
                    </div>
                    {i < 2 && <div className={cn("w-8 h-px", isDone ? "bg-emerald-300" : "bg-gray-200 dark:bg-slate-700")} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {status === 'failed' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center" data-testid="processing-error">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-400 font-medium">Processing Failed</p>
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</p>
            <Button variant="outline" onClick={() => navigate('/meetings')} className="mt-4">Back to Meetings</Button>
          </div>
        )}

        {/* Results */}
        {status === 'completed' && insights && (
          <>
            {/* Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6" data-testid="meeting-summary">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Summary</h3>
                {insights.sentiment && <SentimentBadge sentiment={insights.sentiment} />}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insights.summary}</p>
              {insights.participation_notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {insights.participation_notes}
                </p>
              )}
              {meeting.duration_seconds > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {Math.round(meeting.duration_seconds / 60)} min
                </p>
              )}
            </div>

            {/* Action Items */}
            {insights.action_items?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden" data-testid="meeting-actions">
                <button onClick={() => toggleSection('actions')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Action Items ({insights.action_items.length})</h3>
                  </div>
                  {expandedSections.actions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedSections.actions && (
                  <div className="px-4 pb-4 space-y-2">
                    {insights.action_items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-slate-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{item.task}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.assignee}</span>
                            <PriorityBadge priority={item.priority} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Key Decisions */}
            {insights.key_decisions?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden" data-testid="meeting-decisions">
                <button onClick={() => toggleSection('decisions')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Key Decisions ({insights.key_decisions.length})</h3>
                  </div>
                  {expandedSections.decisions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedSections.decisions && (
                  <div className="px-4 pb-4 space-y-2">
                    {insights.key_decisions.map((d, i) => (
                      <div key={i} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{d.decision}</p>
                        {d.context && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{d.context}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Topics Discussed */}
            {insights.topics_discussed?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden" data-testid="meeting-topics">
                <button onClick={() => toggleSection('topics')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Topics Discussed ({insights.topics_discussed.length})</h3>
                  </div>
                  {expandedSections.topics ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedSections.topics && (
                  <div className="px-4 pb-4 space-y-2">
                    {insights.topics_discussed.map((t, i) => (
                      <div key={i} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.topic}</p>
                          {t.duration_estimate && <span className="text-[10px] text-gray-400">{t.duration_estimate}</span>}
                        </div>
                        {t.key_points?.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {t.key_points.map((p, j) => (
                              <li key={j} className="text-xs text-gray-500 dark:text-gray-400 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-blue-300">{p}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Follow-ups */}
            {insights.follow_ups?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4" data-testid="meeting-followups">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Follow-ups</h3>
                </div>
                <div className="space-y-2">
                  {insights.follow_ups.map((f, i) => (
                    <div key={i} className="flex items-start justify-between p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{f.item}</p>
                      {f.due && <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{f.due}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Transcript (collapsed by default) */}
            {transcript?.text && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden" data-testid="meeting-transcript">
                <button onClick={() => toggleSection('transcript')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Full Transcript</h3>
                  </div>
                  {expandedSections.transcript ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {expandedSections.transcript && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{transcript.text}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MeetingProcessingPage;
