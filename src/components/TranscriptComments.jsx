
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Trash2, Edit2, Reply, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { commentsService } from '@/services/commentsService';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ comment, currentUser, onDelete, onUpdate, onReply }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const isOwner = currentUser?.id === comment.userId;

  const handleUpdate = () => {
    onUpdate(comment.id, editText);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-3 mb-6 group">
      <Avatar className="w-8 h-8">
        <AvatarImage src={comment.userProfile?.avatar_url} />
        <AvatarFallback>{comment.userProfile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-text-primary">{comment.userProfile?.full_name || 'Unknown User'}</span>
            <span className="text-xs text-text-secondary">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
            {comment.isEdited && <span className="text-xs text-text-secondary">(edited)</span>}
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-3 h-3 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => onDelete(comment.id)}>
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[80px]" 
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdate}>Save</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{comment.text}</p>
        )}

        <div className="mt-2">
           <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-indigo-500 hover:text-indigo-600 hover:bg-transparent" onClick={() => onReply(comment)}>
             <Reply className="w-3 h-3 mr-1" /> Reply
           </Button>
        </div>
      </div>
    </div>
  );
};

const TranscriptComments = ({ transcriptId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null); // comment object

  useEffect(() => {
    if (!transcriptId) return;

    // Initial load
    setComments(commentsService.getCommentsByTranscript(transcriptId));

    // Subscribe
    const unsubscribe = commentsService.subscribeToComments(transcriptId, (payload) => {
      if (payload.type === 'COMMENT_ADDED') {
        setComments(prev => [...prev, payload.comment]);
      } else if (payload.type === 'COMMENT_UPDATED') {
        setComments(prev => prev.map(c => c.id === payload.comment.id ? payload.comment : c));
      } else if (payload.type === 'COMMENT_DELETED') {
        setComments(prev => prev.filter(c => c.id !== payload.commentId));
      }
    });

    return () => unsubscribe();
  }, [transcriptId]);

  const handleSubmit = () => {
    if (!newComment.trim() || !user) return;
    
    commentsService.addComment(
      transcriptId,
      user.id,
      { full_name: user.full_name, avatar_url: user.avatar_url },
      newComment,
      replyTo?.id
    );

    setNewComment('');
    setReplyTo(null);
  };

  const handleDelete = (id) => {
    commentsService.deleteComment(id);
  };

  const handleUpdate = (id, text) => {
    commentsService.updateComment(id, text);
  };

  // Group comments (basic single level nesting)
  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId) => comments.filter(c => c.parentId === parentId);

  return (
    <div className="bg-card border border-border rounded-xl h-full flex flex-col shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          Comments ({comments.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {rootComments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          rootComments.map(comment => (
            <div key={comment.id}>
              <CommentItem 
                comment={comment} 
                currentUser={user} 
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onReply={setReplyTo}
              />
              {/* Replies */}
              <div className="pl-11">
                {getReplies(comment.id).map(reply => (
                  <CommentItem 
                    key={reply.id} 
                    comment={reply} 
                    currentUser={user}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    onReply={setReplyTo}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-gray-50/50 dark:bg-gray-900/50">
        {replyTo && (
           <div className="flex items-center justify-between text-xs text-indigo-500 mb-2 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded">
             <span>Replying to {replyTo.userProfile?.full_name}...</span>
             <button onClick={() => setReplyTo(null)} className="hover:underline">Cancel</button>
           </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
            className="min-h-[44px] max-h-[120px]"
          />
          <Button 
            size="icon" 
            className="h-11 w-11 shrink-0 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSubmit}
            disabled={!newComment.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptComments;
