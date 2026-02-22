
import React, { useState, useEffect } from 'react';
import { annotationsService } from '@/services/annotationsService';
import { useAuth } from '@/context/AuthContext';
import { X } from 'lucide-react';

// NOTE: This is a simplified annotation viewer. 
// A full implementation requires hooking into the text selection API of the specific editor or viewer being used.
// This component manages the state and side-panel view of annotations.

const TranscriptAnnotations = ({ transcriptId }) => {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    if (!transcriptId) return;

    setAnnotations(annotationsService.getAnnotationsByTranscript(transcriptId));

    const unsubscribe = annotationsService.subscribeToAnnotations(transcriptId, (payload) => {
      if (payload.type === 'ANNOTATION_ADDED') {
        setAnnotations(prev => [...prev, payload.annotation]);
      } else if (payload.type === 'ANNOTATION_DELETED') {
        setAnnotations(prev => prev.filter(a => a.id !== payload.annotationId));
      }
    });

    return () => unsubscribe();
  }, [transcriptId]);

  const handleDelete = (id) => {
    annotationsService.deleteAnnotation(id);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-text-secondary uppercase tracking-wider">Highlights</h3>
      {annotations.length === 0 ? (
        <p className="text-sm text-text-secondary italic">No highlights added yet.</p>
      ) : (
        <div className="grid gap-3">
          {annotations.map(anno => (
            <div key={anno.id} className="relative p-3 rounded-lg border bg-card/50 text-sm group transition-all hover:bg-card">
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
                style={{ backgroundColor: anno.color || 'yellow' }}
              />
              <p className="font-medium text-text-primary mb-1 pl-2">"{anno.text}"</p>
              <div className="flex items-center justify-between pl-2 mt-2">
                <span className="text-xs text-text-secondary">
                   By {anno.userProfile?.full_name || 'User'}
                </span>
                {user?.id === anno.userId && (
                  <button 
                    onClick={() => handleDelete(anno.id)}
                    className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 p-1 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptAnnotations;
