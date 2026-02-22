
import { v4 as uuidv4 } from 'uuid';
import { realtimeService } from './realtimeService';

const NOTES_KEY = 'munal_shared_notes';

const getNotes = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveNotes = (notes) => {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const collaborativeNotesService = {
  getNote: (transcriptId) => {
    const allNotes = getNotes();
    return allNotes[transcriptId] || { content: '', updatedAt: null };
  },

  updateNote: (transcriptId, content, userId) => {
    const allNotes = getNotes();
    const noteData = {
      content,
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };
    
    allNotes[transcriptId] = noteData;
    saveNotes(allNotes);

    realtimeService.broadcast(`transcript:${transcriptId}:notes`, {
      type: 'NOTE_UPDATE',
      content,
      userId
    });

    return noteData;
  },

  subscribeToNotes: (transcriptId, callback) => {
    return realtimeService.subscribe(`transcript:${transcriptId}:notes`, (payload) => {
      callback(payload);
    });
  }
};
