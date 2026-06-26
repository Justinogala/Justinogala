import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Loader2, StickyNote, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const API_BASE = window.location.origin;

const LessonSummary = ({ courseId, lessonId, token, enrolled }) => {
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (!courseId || !lessonId) return;
    // Fetch existing summary
    fetch(`${API_BASE}/api/academy/courses/${courseId}/lessons/${lessonId}/summary`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.ok ? r.json() : { summary: null })
      .then(d => setSummary(d.summary));

    // Fetch user notes
    if (token) {
      fetch(`${API_BASE}/api/academy/courses/${courseId}/lessons/${lessonId}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : { note: null })
        .then(d => {
          if (d.note) {
            setNote(d.note.content);
            setSavedNote(d.note);
          }
        });
    }
  }, [courseId, lessonId, token]);

  const generateSummary = async () => {
    if (!token) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/lessons/${lessonId}/summary`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setSummary(d.summary);
      }
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const saveNote = async () => {
    if (!token || !note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note, lesson_id: lessonId })
      });
      if (res.ok) {
        const d = await res.json();
        setSavedNote(d.note);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (!enrolled) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid="lesson-summary-notes">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => setActiveTab('summary')}
          className={cn("flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
            activeTab === 'summary' ? "text-violet-600 border-b-2 border-violet-600 bg-violet-50/50 dark:bg-violet-900/10" : "text-gray-500 hover:text-gray-700")}>
          <Sparkles className="w-3.5 h-3.5" /> AI Summary
        </button>
        <button onClick={() => setActiveTab('notes')}
          className={cn("flex-1 px-4 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
            activeTab === 'notes' ? "text-violet-600 border-b-2 border-violet-600 bg-violet-50/50 dark:bg-violet-900/10" : "text-gray-500 hover:text-gray-700")}>
          <StickyNote className="w-3.5 h-3.5" /> My Notes
          {savedNote && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'summary' ? (
          <>
            {summary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap" data-testid="summary-content">
                {summary.content}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-violet-500" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No summary yet for this lesson</p>
                <Button onClick={generateSummary} disabled={generating} size="sm" className="bg-violet-600 hover:bg-violet-700 gap-1.5" data-testid="generate-summary-btn">
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {generating ? 'Generating...' : 'Generate AI Summary'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Take notes about this lesson... These are private and only visible to you."
              rows={6}
              className="text-sm resize-none"
              data-testid="lesson-notes-input"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                {savedNote ? `Last saved: ${new Date(savedNote.updated_at).toLocaleString()}` : 'Not saved yet'}
              </span>
              <Button onClick={saveNote} disabled={saving || !note.trim()} size="sm" variant="outline" className="gap-1.5" data-testid="save-notes-btn">
                {saved ? <Check className="w-3.5 h-3.5 text-green-500" /> : saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? 'Saved!' : 'Save Notes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonSummary;
