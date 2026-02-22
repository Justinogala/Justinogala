
import { v4 as uuidv4 } from 'uuid';
import { realtimeService } from './realtimeService';

const ANNOTATIONS_KEY = 'munal_annotations';

const getAnnotations = () => {
  try {
    return JSON.parse(localStorage.getItem(ANNOTATIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveAnnotations = (annotations) => {
  localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
};

export const annotationsService = {
  getAnnotationsByTranscript: (transcriptId) => {
    const all = getAnnotations();
    return all.filter(a => a.transcriptId === transcriptId);
  },

  addAnnotation: (transcriptId, userId, userProfile, range, text, color = 'yellow') => {
    const annotations = getAnnotations();
    const newAnnotation = {
      id: uuidv4(),
      transcriptId,
      userId,
      userProfile,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      text: text, // The text being highlighted
      note: '', // Optional user note attached to highlight
      color,
      createdAt: new Date().toISOString()
    };

    annotations.push(newAnnotation);
    saveAnnotations(annotations);

    realtimeService.broadcast(`transcript:${transcriptId}:annotations`, {
      type: 'ANNOTATION_ADDED',
      annotation: newAnnotation
    });

    return newAnnotation;
  },

  deleteAnnotation: (annotationId) => {
    const annotations = getAnnotations();
    const annotationToDelete = annotations.find(a => a.id === annotationId);
    if (!annotationToDelete) return false;

    const filtered = annotations.filter(a => a.id !== annotationId);
    saveAnnotations(filtered);

    realtimeService.broadcast(`transcript:${annotationToDelete.transcriptId}:annotations`, {
      type: 'ANNOTATION_DELETED',
      annotationId
    });

    return true;
  },

  subscribeToAnnotations: (transcriptId, callback) => {
    return realtimeService.subscribe(`transcript:${transcriptId}:annotations`, (payload) => {
      callback(payload);
    });
  }
};
