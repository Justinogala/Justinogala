
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, RotateCw, Loader2, Edit3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { liveEditingService } from '@/services/liveEditingService';
import { presenceService } from '@/services/presenceService';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const LiveTranscriptEditor = ({ transcriptId, initialText, onSave }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState(initialText || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cursors, setCursors] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!transcriptId) return;

    // Initialize services
    liveEditingService.initialize(initialText, transcriptId);
    
    // Subscribe to remote edits
    const handleRemoteUpdate = (e) => {
      const { text: newText, remote } = e.detail;
      if (remote) {
        setText(newText);
        toast({ title: "Updated", description: "Transcript updated by another user." });
      }
    };

    // Subscribe to presence/cursors
    const handlePresenceUpdate = (e) => {
      const activeUsers = e.detail;
      // Filter out self and users without cursor data
      const remoteCursors = activeUsers
        .filter(u => u.id !== user?.id && u.cursor)
        .map(u => ({
          ...u.cursor,
          color: u.color || '#6366f1', // Fallback color
          name: u.full_name || 'User'
        }));
      setCursors(remoteCursors);
    };

    window.addEventListener(`transcript-update-${transcriptId}`, handleRemoteUpdate);
    window.addEventListener(`presence-update-${transcriptId}`, handlePresenceUpdate);

    return () => {
      window.removeEventListener(`transcript-update-${transcriptId}`, handleRemoteUpdate);
      window.removeEventListener(`presence-update-${transcriptId}`, handlePresenceUpdate);
    };
  }, [transcriptId, initialText, user, toast]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Broadcast edit
    const selection = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    };
    liveEditingService.applyLocalEdit(newText, selection);

    // Broadcast cursor/presence
    if (isEditing) {
      presenceService.updateCursor({
        index: e.target.selectionStart,
        length: e.target.selectionEnd - e.target.selectionStart
      });
    }
  };

  const handleCursorSelect = (e) => {
    if (isEditing) {
      presenceService.updateCursor({
        index: e.target.selectionStart,
        length: e.target.selectionEnd - e.target.selectionStart
      });
    }
  };

  const handleUndo = () => {
    const prevState = liveEditingService.undo();
    if (prevState) setText(prevState.text);
  };

  const handleRedo = () => {
    const nextState = liveEditingService.redo();
    if (nextState) setText(nextState.text);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) await onSave(text);
      setIsEditing(false);
      toast({ title: "Saved", description: "Transcript saved successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save transcript." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative group">
      {/* Remote Cursors Overlay (Simplified visual representation) */}
      {isEditing && cursors.length > 0 && (
        <div className="absolute top-0 right-0 p-2 z-10 flex flex-col gap-1 pointer-events-none">
          {cursors.map((cursor, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs bg-black/70 text-white px-2 py-1 rounded">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cursor.color }}></span>
               {cursor.name} is editing...
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-indigo-500" />
          Live Editor
        </h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleUndo}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRedo}>
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit3 className="w-4 h-4" /> Edit Transcript
            </Button>
          ) : (
            <Button onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="relative rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onSelect={handleCursorSelect}
            className="min-h-[500px] w-full p-6 font-mono text-sm leading-relaxed resize-none focus:ring-0 border-0 bg-transparent"
            placeholder="Transcript text..."
          />
        ) : (
          <div className="min-h-[500px] p-6 whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-secondary">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTranscriptEditor;
