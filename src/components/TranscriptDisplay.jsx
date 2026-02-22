
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Copy, Edit2, Save, FileText, Check, Clock, Calendar, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

const TranscriptDisplay = ({ transcript, onSave, metadata }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(transcript?.text || transcript?.transcribedText || '');
  const [searchQuery, setSearchQuery] = useState('');

  const wordCount = text.trim().split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200); // 200 wpm

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Transcript copied to clipboard" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy text" });
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 15, 15);
    doc.save(`transcript-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onSave) onSave(text);
    toast({ title: "Saved", description: "Transcript changes saved successfully" });
  };

  // Simple highlighting logic
  const renderHighlightedText = (content) => {
    if (!content) return <p className="text-gray-400 italic">No content available.</p>;
    if (!searchQuery) return <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">{content}</p>;

    const parts = content.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 dark:bg-yellow-900 text-black dark:text-white rounded px-0.5">{part}</span>
          ) : (
            part
          )
        )}
      </p>
    );
  };

  return (
    <Card className="shadow-lg border-t-4 border-t-indigo-500">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <div className="relative w-48 hidden sm:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 h-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 text-sm">
          {metadata?.duration && (
            <Badge variant="secondary" className="font-normal">
              <Clock className="w-3 h-3 mr-1" /> Duration: {Math.round(metadata.duration)}s
            </Badge>
          )}
          {metadata?.language && (
            <Badge variant="secondary" className="font-normal">
              <Globe className="w-3 h-3 mr-1" /> {metadata.language}
            </Badge>
          )}
          <Badge variant="secondary" className="font-normal">
             {wordCount} words
          </Badge>
          <Badge variant="secondary" className="font-normal">
             ~{readTime} min read
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              className="min-h-[400px] font-mono text-sm leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto border border-gray-100 dark:border-gray-800">
              {renderHighlightedText(text)}
            </div>
            
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
                <Download className="w-4 h-4 mr-2" /> Download TXT
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranscriptDisplay;
