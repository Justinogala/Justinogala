import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { FlaskConical, Clock, ArrowRight, CheckCircle, Send, Loader2, ExternalLink, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const API_BASE = window.location.origin;

const PracticeLabs = ({ courseId, token, enrolled }) => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLab, setActiveLab] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!courseId) return;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`${API_BASE}/api/academy/courses/${courseId}/labs`, { headers })
      .then(r => r.ok ? r.json() : { labs: [] })
      .then(d => setLabs(d.labs || []))
      .finally(() => setLoading(false));
  }, [courseId, token]);

  const handleSubmit = async (labId) => {
    if (!submissionContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/labs/${labId}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: submissionContent, repo_url: repoUrl })
      });
      if (res.ok) {
        toast({ title: 'Lab submitted!' });
        setActiveLab(null);
        setSubmissionContent('');
        setRepoUrl('');
        // Refresh labs
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const r2 = await fetch(`${API_BASE}/api/academy/courses/${courseId}/labs`, { headers });
        if (r2.ok) { const d = await r2.json(); setLabs(d.labs || []); }
      } else {
        const d = await res.json();
        toast({ variant: 'destructive', title: d.detail || 'Failed to submit' });
      }
    } catch { toast({ variant: 'destructive', title: 'Network error' }); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>;
  if (labs.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid="practice-labs">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Practice Labs</h3>
        <Badge variant="secondary" className="text-[10px] ml-auto">{labs.length} labs</Badge>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
        {labs.map(lab => (
          <div key={lab.id} className="p-4" data-testid={`lab-${lab.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{lab.title}</h4>
                  {lab.submitted && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{lab.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lab.estimated_time}</span>
                  <Badge variant="outline" className={cn("text-[9px] capitalize", lab.difficulty === 'beginner' ? 'border-green-200 text-green-600' : 'border-amber-200 text-amber-600')}>{lab.difficulty}</Badge>
                  {(lab.skills || []).slice(0, 3).map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px]">{s}</span>
                  ))}
                </div>
              </div>
              {enrolled && !lab.submitted && (
                <Button size="sm" variant="outline" className="text-xs shrink-0 gap-1" onClick={() => setActiveLab(activeLab === lab.id ? null : lab.id)} data-testid={`start-lab-${lab.id}`}>
                  <Code className="w-3 h-3" /> {activeLab === lab.id ? 'Close' : 'Start Lab'}
                </Button>
              )}
              {lab.submitted && (
                <Badge className="bg-green-100 text-green-700 text-[10px] shrink-0">Submitted</Badge>
              )}
            </div>

            {activeLab === lab.id && (
              <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
                <Textarea
                  value={submissionContent}
                  onChange={e => setSubmissionContent(e.target.value)}
                  placeholder="Describe your solution, approach, and key learnings..."
                  rows={4} className="text-sm resize-none"
                  data-testid="lab-submission-content"
                />
                <Input value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
                  placeholder="GitHub repo URL (optional)" className="text-sm h-9"
                  data-testid="lab-repo-url" />
                <Button onClick={() => handleSubmit(lab.id)} disabled={submitting || !submissionContent.trim()}
                  size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-1.5" data-testid="submit-lab-btn">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Lab
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeLabs;
