
import { format } from 'date-fns';

export const formatTranscriptionForPDF = (transcription) => {
  return {
    title: transcription.title || 'Untitled Transcription',
    date: transcription.date ? format(new Date(transcription.date), 'MMMM dd, yyyy') : 'Unknown Date',
    duration: transcription.duration || '00:00',
    content: transcription.text || transcription.transcription || 'No content available.',
    id: transcription.id,
    participants: transcription.participants || [],
  };
};

export const formatTranscriptionForWord = (transcription) => {
  return {
    title: transcription.title || 'Untitled Transcription',
    date: transcription.date ? format(new Date(transcription.date), 'MMMM dd, yyyy') : 'Unknown Date',
    duration: transcription.duration || '00:00',
    content: transcription.text || transcription.transcription || 'No content available.',
    id: transcription.id,
  };
};

export const calculateFileSizeEstimate = (text) => {
  if (!text) return '0 KB';
  // Rough estimate: 1 char ~= 1 byte, plus overhead for PDF/Docx structure
  const bytes = text.length + 5000; 
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const generateFileName = (title, date) => {
  const sanitizedTitle = (title || 'transcription').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = date ? format(new Date(date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  return `${sanitizedTitle}_${dateStr}`;
};

export const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
  const numSeconds = parseInt(seconds, 10);
  const mins = Math.floor(numSeconds / 60);
  const secs = numSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
