
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, Copy, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const TranscriptViewer = ({ segments }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    const fullText = segments.map(s => `${s.speaker} (${formatTime(s.start)}): ${s.text}`).join('\n');
    navigator.clipboard.writeText(fullText);
    toast({ title: "Copied to clipboard", description: "Transcript copied successfully." });
  };

  const handleDownload = () => {
    const fullText = segments.map(s => `${s.speaker} (${formatTime(s.start)}): ${s.text}`).join('\n');
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredSegments = segments.filter(segment => 
    segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-white/10 sticky top-0 bg-slate-900/95 backdrop-blur z-10 rounded-t-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl">Transcript</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transcript..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full md:w-[200px] h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-[600px] overflow-y-auto p-4 space-y-6">
          {filteredSegments.length > 0 ? (
            filteredSegments.map((segment) => (
              <div key={segment.id} className="flex gap-4 group">
                <div className="w-16 flex-shrink-0 pt-1">
                  <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(segment.start)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-400 mb-1">{segment.speaker}</p>
                  <p className="text-gray-300 leading-relaxed">
                    {searchQuery ? (
                      segment.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === searchQuery.toLowerCase() ? 
                          <span key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{part}</span> : part
                      )
                    ) : segment.text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              No matching segments found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TranscriptViewer;
