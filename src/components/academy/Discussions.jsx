import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Send, ArrowLeft, Loader2, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_BASE = window.location.origin;

const Discussions = ({ courseId, lessonId, token, enrolled }) => {
  const [discussions, setDiscussions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [filterLesson, setFilterLesson] = useState(false);

  const fetchDiscussions = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20' });
    if (filterLesson && lessonId) params.set('lesson_id', lessonId);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/discussions?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const d = await res.json();
        setDiscussions(d.discussions || []);
        setTotal(d.total || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDiscussions(); }, [courseId, filterLesson, lessonId]);

  const fetchDiscussion = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/discussions/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const d = await res.json();
        setActiveDiscussion(d);
      }
    } catch (e) { console.error(e); }
  };

  const createDiscussion = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent, lesson_id: lessonId || '' })
      });
      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setShowCreate(false);
        fetchDiscussions();
      }
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const submitReply = async () => {
    if (!replyContent.trim() || !activeDiscussion) return;
    setReplying(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/courses/${courseId}/discussions/${activeDiscussion.id}/replies`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });
      if (res.ok) {
        setReplyContent('');
        fetchDiscussion(activeDiscussion.id);
      }
    } catch (e) { console.error(e); }
    finally { setReplying(false); }
  };

  const toggleUpvote = async (discId) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/academy/courses/${courseId}/discussions/${discId}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (activeDiscussion?.id === discId) fetchDiscussion(discId);
      else fetchDiscussions();
    } catch (e) { console.error(e); }
  };

  // Discussion Detail View
  if (activeDiscussion) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid="discussion-detail">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <button onClick={() => setActiveDiscussion(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">{activeDiscussion.title}</h3>
        </div>

        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Original post */}
          <div className="p-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-[10px] font-bold text-violet-700 dark:text-violet-300">
                {(activeDiscussion.user_name || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{activeDiscussion.user_name || 'Anonymous'}</p>
                <p className="text-[10px] text-gray-400">{new Date(activeDiscussion.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => toggleUpvote(activeDiscussion.id)} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" /> {activeDiscussion.upvotes || 0}
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{activeDiscussion.content}</p>
          </div>

          {/* Replies */}
          {(activeDiscussion.replies || []).map(reply => (
            <div key={reply.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 ml-4" data-testid={`reply-${reply.id}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-500">
                  {(reply.user_name || '?')[0]?.toUpperCase()}
                </div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{reply.user_name || 'Anonymous'}</p>
                <span className="text-[10px] text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap pl-8">{reply.content}</p>
            </div>
          ))}

          {(activeDiscussion.replies || []).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No replies yet. Be the first to respond!</p>
          )}
        </div>

        {/* Reply Input */}
        {enrolled && token && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-end gap-2">
              <Textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Write a reply..." rows={2} className="text-sm resize-none flex-1" data-testid="reply-input" />
              <Button onClick={submitReply} disabled={replying || !replyContent.trim()} size="sm" className="bg-violet-600 hover:bg-violet-700 h-9 px-3" data-testid="submit-reply-btn">
                {replying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Discussion List View
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden" data-testid="discussions-panel">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-500" /> Discussions
          <Badge variant="secondary" className="text-[10px] px-1.5">{total}</Badge>
        </h3>
        <div className="flex items-center gap-2">
          {lessonId && (
            <button onClick={() => setFilterLesson(!filterLesson)}
              className={cn("text-[10px] px-2 py-1 rounded-full border transition-colors",
                filterLesson ? "border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300" : "border-gray-200 text-gray-500 dark:border-gray-700")}>
              This lesson
            </button>
          )}
          {enrolled && token && (
            <Button onClick={() => setShowCreate(!showCreate)} size="sm" variant="outline" className="h-7 text-xs gap-1" data-testid="new-discussion-btn">
              <Plus className="w-3 h-3" /> New
            </Button>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-950/50 space-y-2">
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Discussion title..." className="text-sm h-9" data-testid="discussion-title-input" />
          <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="What would you like to discuss?" rows={3} className="text-sm resize-none" data-testid="discussion-content-input" />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCreate(false)} size="sm" variant="ghost" className="h-7 text-xs">Cancel</Button>
            <Button onClick={createDiscussion} disabled={creating || !newTitle.trim() || !newContent.trim()} size="sm" className="bg-violet-600 hover:bg-violet-700 h-7 text-xs gap-1" data-testid="create-discussion-btn">
              {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Post
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-500" /></div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No discussions yet. Start the conversation!</p>
          </div>
        ) : (
          discussions.map(d => (
            <button key={d.id} onClick={() => fetchDiscussion(d.id)}
              className="w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex items-start gap-3"
              data-testid={`discussion-${d.id}`}>
              <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0 mt-0.5">
                {(d.user_name || '?')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{d.title}</p>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{d.content}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                  <span>{d.user_name || 'Anonymous'}</span>
                  <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" /> {d.upvotes || 0}</span>
                  <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" /> {d.reply_count || 0}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Discussions;
