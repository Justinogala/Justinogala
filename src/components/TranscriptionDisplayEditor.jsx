
import React, { useState } from 'react';
import { Copy, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatDuration } from '@/utils/transcriptionExportUtils';

const TranscriptionDisplayEditor = ({ transcription, onSave }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(transcription.text || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ description: "Copied to clipboard" });
  };

  const handleSave = () => {
    setIsEditing(false);
    onSave({ ...transcription, text });
    toast({ title: "Saved", description: "Transcription updated successfully" });
  };

  return (
    <Card className="w-full bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <Badge variant="outline" className="text-gray-500">
            {transcription.language || 'English'}
          </Badge>
          <Badge variant="outline" className="text-gray-500">
            {formatDuration(transcription.duration)}
          </Badge>
          {transcription.confidence && (
            <Badge variant="outline" className={transcription.confidence > 0.9 ? "text-green-600" : "text-yellow-600"}>
              {Math.round(transcription.confidence * 100)}% Confidence
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
           <Button variant="ghost" size="sm" onClick={handleCopy}>
             {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
           </Button>
           {isEditing ? (
             <div className="flex gap-2">
               <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
               <Button size="sm" onClick={handleSave} className="bg-indigo-600 text-white">
                 <Save className="w-4 h-4 mr-2" /> Save
               </Button>
             </div>
           ) : (
             <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
               Edit Text
             </Button>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isEditing ? (
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            className="min-h-[400px] font-serif text-lg leading-relaxed p-4"
          />
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            {/* If we have utterances/speakers, map them */}
            {transcription.utterances && transcription.utterances.length > 0 ? (
              <div className="space-y-6">
                {transcription.utterances.map((utt, idx) => (
                  <div key={idx} className="group">
                     <div className="flex items-baseline gap-3 mb-1">
                       <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                         Speaker {utt.speaker}
                       </span>
                       <span className="text-xs text-gray-400 font-mono">
                         {formatDuration(utt.start / 1000)}
                       </span>
                     </div>
                     <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                       {utt.text}
                     </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                {text}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TranscriptionDisplayEditor;
