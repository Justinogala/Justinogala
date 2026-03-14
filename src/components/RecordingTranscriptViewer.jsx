import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Clock, Download, Copy, Check, 
  Loader2, RefreshCw, X, ChevronDown, ChevronUp,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

import { getApiUrl, API_URL } from '@/lib/api';

const RecordingTranscriptViewer = ({ fileId, fileName, onClose, onTimestampClick, isOpen }) => {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSegments, setExpandedSegments] = useState(true);

  useEffect(() => {
    if (fileId && isOpen) {
      fetchTranscript();
    }
  }, [fileId, isOpen]);

  const fetchTranscript = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/ai/transcribe/recording/${fileId}`);
      const data = await response.json();
      
      if (data.success && data.transcript) {
        setTranscript(data.transcript);
      } else {
        setError(data.message || 'No transcript found');
      }
    } catch (err) {
      console.error('Fetch transcript error:', err);
      setError('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  // Filter segments based on search
  const filteredSegments = useMemo(() => {
    if (!transcript?.segments || !searchTerm) {
      return transcript?.segments || [];
    }
    
    return transcript.segments.filter(seg => 
      seg.text?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transcript, searchTerm]);

  // Highlight search matches in text
  const highlightText = (text, search) => {
    if (!search || !text) return text;
    
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === search.toLowerCase() 
        ? <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{part}</mark>
        : part
    );
  };

  // Format timestamp for display
  const formatTimestamp = (seconds) => {
    if (typeof seconds !== 'number') return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy full transcript to clipboard
  const copyTranscript = () => {
    if (!transcript?.text) return;
    
    navigator.clipboard.writeText(transcript.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to Clipboard' });
  };

  // Download transcript as text file
  const downloadTranscript = () => {
    if (!transcript?.text) return;
    
    const content = transcript.segments
      ? transcript.segments.map(seg => 
          `[${formatTimestamp(seg.start)}] ${seg.text}`
        ).join('\n')
      : transcript.text;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName?.replace(/\.[^/.]+$/, '') || 'transcript'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Transcript Downloaded' });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Transcript</h3>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-none">
                {fileName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {transcript?.duration && (
              <Badge variant="secondary" className="bg-slate-700 text-slate-300 hidden sm:flex">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimestamp(transcript.duration)}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyTranscript}
              className="text-slate-400 hover:text-white"
              title="Copy transcript"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={downloadTranscript}
              className="text-slate-400 hover:text-white"
              title="Download transcript"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-400">Loading transcript...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
              <FileText className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchTranscript} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {/* Transcript content */}
          {!loading && !error && transcript && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search transcript..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700"
                />
                {searchTerm && (
                  <Badge 
                    variant="secondary" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-500/20 text-indigo-300"
                  >
                    {filteredSegments.length} matches
                  </Badge>
                )}
              </div>

              {/* Segments Toggle */}
              {transcript?.segments?.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSegments(!expandedSegments)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white mb-3 self-start -ml-2"
                >
                  {expandedSegments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {expandedSegments ? 'Show Full Text' : 'Show Timestamps'} ({transcript.segments.length} segments)
                </Button>
              )}

              {/* Scrollable content */}
              <ScrollArea className="flex-1">
                <AnimatePresence mode="wait">
                  {expandedSegments && transcript?.segments?.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-1 pr-4"
                    >
                      {filteredSegments.map((segment, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(index * 0.01, 0.5) }}
                          className="group flex gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                          <button
                            onClick={() => onTimestampClick?.(segment.start)}
                            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-mono rounded hover:bg-indigo-500/30 transition-colors"
                            title="Click to jump to this timestamp"
                          >
                            <Play className="w-3 h-3" />
                            {formatTimestamp(segment.start)}
                          </button>
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {highlightText(segment.text, searchTerm)}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 bg-slate-800/30 rounded-lg"
                    >
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {highlightText(transcript?.text, searchTerm)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Footer Stats */}
        {transcript && !loading && !error && (
          <div className="p-4 border-t border-slate-700 bg-slate-800/30">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {transcript?.segments?.length || 0} segments
              </span>
              <span>
                ~{transcript?.text?.split(/\s+/).filter(Boolean).length || 0} words
              </span>
              <span>
                Language: {transcript?.language?.toUpperCase() || 'EN'}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RecordingTranscriptViewer;
