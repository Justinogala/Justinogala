import React, { useState, useEffect } from 'react';
import { FileText, Loader2, RotateCcw, Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const API_BASE = window.location.origin;

export const TranscriptDialog = ({ open, onOpenChange, recording, userId, onRetranscribe }) => {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!open || !recording) return;
    let cancelled = false;
    let pollTimer = null;

    const fetchTranscript = async () => {
      try {
        const ownerId = recording.user_id || userId;
        const res = await fetch(`${API_BASE}/api/recordings/${ownerId}/${recording.id}/transcript`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (cancelled) return;

        setStatus(data.transcript_status || 'none');
        setTranscript(data.transcript);
        setError(data.transcript_error);

        // Poll if still processing
        if (data.transcript_status === 'pending' || data.transcript_status === 'processing') {
          pollTimer = setTimeout(fetchTranscript, 3000);
        }
      } catch {
        if (!cancelled) { setStatus('error'); setError('Could not load transcript'); }
      }
    };

    fetchTranscript();
    return () => { cancelled = true; if (pollTimer) clearTimeout(pollTimer); };
  }, [open, recording, userId]);

  const handleRetranscribe = async () => {
    if (!recording) return;
    setRetrying(true);
    try {
      const res = await fetch(`${API_BASE}/api/recordings/${userId}/${recording.id}/retranscribe`, { method: 'POST' });
      if (res.ok) {
        setStatus('pending'); setTranscript(null); setError(null);
        toast({ title: "Transcription re-queued" });
        onRetranscribe?.();
      }
    } catch { toast({ variant: "destructive", title: "Failed to retry" }); }
    finally { setRetrying(false); }
  };

  const copyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast({ title: "Transcript copied" });
  };

  const downloadTranscript = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(recording?.title || 'transcript').replace(/[^a-z0-9]/gi, '_')}_transcript.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Transcript downloaded" });
  };

  const isProcessing = status === 'pending' || status === 'processing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-500" />
            Transcript
          </DialogTitle>
          <DialogDescription className="truncate">{recording?.title}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3" data-testid="transcript-processing">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-sm text-gray-500">Transcribing your recording...</p>
              <p className="text-xs text-gray-400">This may take a moment depending on length</p>
            </div>
          )}

          {status === 'completed' && transcript && (
            <div className="space-y-3">
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={copyTranscript} className="gap-1.5 text-xs" data-testid="copy-transcript-btn">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTranscript} className="gap-1.5 text-xs" data-testid="download-transcript-btn">
                  <Download className="w-3.5 h-3.5" /> Download .txt
                </Button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 max-h-[400px] overflow-y-auto" data-testid="transcript-content">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{transcript}</p>
              </div>
              <p className="text-xs text-gray-400 text-right">{transcript.split(/\s+/).length} words</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3" data-testid="transcript-failed">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transcription failed</p>
              <p className="text-xs text-gray-400 max-w-sm text-center">{error || 'Unknown error'}</p>
              <Button onClick={handleRetranscribe} disabled={retrying} variant="outline" size="sm" className="gap-2 mt-2" data-testid="retry-transcribe-btn">
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Retry Transcription
              </Button>
            </div>
          )}

          {(status === 'none' || status === 'error') && !isProcessing && status !== 'failed' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3" data-testid="transcript-none">
              <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500">No transcript available</p>
              <p className="text-xs text-gray-400">This recording was created before auto-transcription was enabled</p>
              <Button onClick={handleRetranscribe} disabled={retrying} variant="outline" size="sm" className="gap-2 mt-2" data-testid="generate-transcript-btn">
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Transcript
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
