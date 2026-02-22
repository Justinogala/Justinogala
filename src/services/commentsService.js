
import { v4 as uuidv4 } from 'uuid';
import { realtimeService } from './realtimeService';

const COMMENTS_KEY = 'munal_comments';

const getComments = () => {
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveComments = (comments) => {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
};

export const commentsService = {
  getCommentsByTranscript: (transcriptId) => {
    const allComments = getComments();
    return allComments.filter(c => c.transcriptId === transcriptId);
  },

  addComment: (transcriptId, userId, userProfile, text, parentId = null) => {
    const comments = getComments();
    const newComment = {
      id: uuidv4(),
      transcriptId,
      userId,
      userProfile, // { name, avatar }
      text,
      parentId, // null for top-level, ID for replies
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    comments.push(newComment);
    saveComments(comments);

    // Sync
    realtimeService.broadcast(`transcript:${transcriptId}:comments`, {
      type: 'COMMENT_ADDED',
      comment: newComment
    });

    return newComment;
  },

  updateComment: (commentId, newText) => {
    const comments = getComments();
    const index = comments.findIndex(c => c.id === commentId);
    if (index === -1) return null;

    comments[index] = {
      ...comments[index],
      text: newText,
      updatedAt: new Date().toISOString(),
      isEdited: true
    };

    saveComments(comments);
    
    // Sync
    realtimeService.broadcast(`transcript:${comments[index].transcriptId}:comments`, {
      type: 'COMMENT_UPDATED',
      comment: comments[index]
    });

    return comments[index];
  },

  deleteComment: (commentId) => {
    let comments = getComments();
    const commentToDelete = comments.find(c => c.id === commentId);
    if (!commentToDelete) return false;

    // Also delete replies
    comments = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
    saveComments(comments);

    // Sync
    realtimeService.broadcast(`transcript:${commentToDelete.transcriptId}:comments`, {
      type: 'COMMENT_DELETED',
      commentId
    });

    return true;
  },

  // Setup listener for real-time updates
  subscribeToComments: (transcriptId, callback) => {
    return realtimeService.subscribe(`transcript:${transcriptId}:comments`, (payload) => {
      callback(payload);
    });
  }
};
