
import { transcriptionHistoryService } from '@/services/transcriptionHistoryService';

const STORAGE_KEY = 'transcription_history';

export const transcriptionDataSync = {
  // Validate structure before saving
  validateTranscriptionData: (data) => {
    const errors = [];
    if (!data) return { valid: false, errors: ['No data provided'] };
    
    if (!data.fileName && !data.title) errors.push('Missing fileName or title');
    if (!data.text && !data.transcribedText) errors.push('Missing transcription text');
    
    // Warn but don't fail on missing metadata
    if (!data.duration) console.warn('Missing duration in transcription data');
    if (!data.language) console.warn('Missing language in transcription data');

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Normalize data from different sources (Whisper, AssemblyAI, Mock)
  normalizeTranscription: (rawData) => {
    return {
      id: rawData.id, // ID might be generated later if missing
      title: rawData.title || rawData.fileName || 'Untitled',
      fileName: rawData.fileName || 'Unknown',
      fileSize: rawData.fileSize || '0 B',
      format: rawData.format || rawData.fileType || 'unknown',
      duration: rawData.duration || '0s',
      language: rawData.language || 'en',
      text: rawData.text || rawData.transcribedText || '',
      transcribedText: rawData.text || rawData.transcribedText || '', // Ensure both exist
      confidence: rawData.confidence || 0,
      timestamp: rawData.timestamp || rawData.uploadDate || new Date().toISOString(),
      status: rawData.status || 'Completed',
      provider: rawData.provider || 'openai',
      insights: rawData.insights || null,
      actionItems: rawData.actionItems || []
    };
  },

  // Recover from localStorage backup if needed
  recoverFromBackup: () => {
    try {
      const backup = localStorage.getItem(`${STORAGE_KEY}_backup`);
      if (backup) {
        localStorage.setItem(STORAGE_KEY, backup);
        return true;
      }
    } catch (e) {
      console.error("Recovery failed", e);
    }
    return false;
  },

  // Create backup
  createBackup: () => {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        localStorage.setItem(`${STORAGE_KEY}_backup`, current);
      }
    } catch (e) {
      console.warn("Backup creation failed", e);
    }
  },
  
  // Verify persistence
  verifyPersistence: (id) => {
    const item = transcriptionHistoryService.getTranscriptionById(id);
    return !!item;
  }
};
