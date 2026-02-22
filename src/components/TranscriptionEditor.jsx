
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RotateCcw, RotateCw, Check, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { transcriptionService } from '@/services/transcriptionService';

const TranscriptionEditor = ({ transcription, onClose, onUpdate }) => {
  const [text, setText] = useState(transcription.text || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    setText(transcription.text || '');
  }, [transcription]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await transcriptionService.updateTranscription(transcription.id, { text });
      setLastSaved(new Date());
      if (onUpdate) onUpdate(updated);
      toast({ title: "Saved", description: "Transcription updated successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const charCount = text.length;

  return (
    <Card className="h-full flex flex-col border-0 shadow-none md:border md:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <CardTitle className="text-lg">{transcription.title}</CardTitle>
            <p className="text-xs text-gray-500">
              {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Unsaved changes'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white hover:bg-indigo-700">
            {saving ? 'Saving...' : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex gap-4">
          <span>Words: {wordCount}</span>
          <span>Characters: {charCount}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-6 px-2"><RotateCcw className="w-3 h-3" /></Button>
          <Button variant="ghost" size="sm" className="h-6 px-2"><RotateCw className="w-3 h-3" /></Button>
        </div>
      </div>

      <CardContent className="flex-grow p-0">
        <Textarea 
          className="w-full h-[600px] md:h-[calc(100vh-300px)] resize-none border-0 p-6 focus-visible:ring-0 text-base leading-relaxed"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or wait for transcription..."
        />
      </CardContent>
    </Card>
  );
};

export default TranscriptionEditor;
