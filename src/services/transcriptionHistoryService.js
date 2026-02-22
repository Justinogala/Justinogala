import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'transcription_history';
const EVENT_KEY = 'transcription_storage_update';

export const transcriptionHistoryService = {
  // Get all transcriptions from storage sorted by date (newest first)
  getTranscriptions: (userId = 'default') => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];
      // Filter by userId if provided, or return all if system-wide admin view (optional)
      // For this implementation, we filter by userId if strict mode, or just return all for simplicity in this prototype
      const filtered = userId && userId !== 'default' ? items.filter(item => item.userId === userId) : items;
      
      return filtered.sort((a, b) => {
        const dateA = new Date(a.uploadDate || a.createdAt || 0);
        const dateB = new Date(b.uploadDate || b.createdAt || 0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error loading transcription history:', error);
      return [];
    }
  },

  // Get a single transcription by ID
  getTranscriptionById: (id) => {
    const transcriptions = transcriptionHistoryService.getTranscriptions();
    return transcriptions.find(t => t.id === id) || null;
  },

  // Save a new transcription or update existing if ID matches
  saveTranscription: (userId, data) => {
    try {
      // Handle method overloading: saveTranscription(data) vs saveTranscription(userId, data)
      let actualUserId = userId;
      let actualData = data;
      
      if (typeof userId === 'object' && !data) {
        actualData = userId;
        actualUserId = actualData.userId || 'default';
      }

      if (!actualData) throw new Error("No data provided for saving.");
      
      const stored = localStorage.getItem(STORAGE_KEY);
      const transcriptions = stored ? JSON.parse(stored) : [];
      
      // Normalize data structure
      const now = new Date().toISOString();
      const existingId = actualData.id;
      
      const entryToSave = {
        id: existingId || uuidv4(),
        userId: actualUserId,
        title: actualData.title || actualData.fileName || 'Untitled Transcription',
        fileName: actualData.fileName || 'Unknown File',
        fileSize: actualData.fileSize || '0 B',
        fileType: actualData.fileType || actualData.format || 'audio/mp3',
        uploadDate: actualData.uploadDate || actualData.createdAt || now,
        updatedAt: now,
        status: actualData.status || 'Completed',
        transcribedText: actualData.transcribedText || actualData.text || '',
        language: actualData.language || 'en',
        duration: actualData.duration || '0:00',
        confidence: actualData.confidence || 0.95,
        provider: actualData.provider || 'openai',
        
        // Extended Metadata
        insights: actualData.insights || null,
        actionItems: Array.isArray(actualData.actionItems) ? actualData.actionItems : [],
        rawResult: actualData.rawResult || null
      };

      // Check if exists
      const existingIndex = transcriptions.findIndex(t => t.id === entryToSave.id);
      
      if (existingIndex >= 0) {
        // Update existing
        transcriptions[existingIndex] = {
          ...transcriptions[existingIndex],
          ...entryToSave,
          // Preserve creation date if updating
          uploadDate: transcriptions[existingIndex].uploadDate || entryToSave.uploadDate
        };
      } else {
        // Add new
        transcriptions.unshift(entryToSave);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(transcriptions));
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new Event(EVENT_KEY));
      
      console.log(`[TranscriptionHistory] Saved transcription ${entryToSave.id}`);
      return entryToSave;
    } catch (error) {
      console.error('Error saving transcription:', error);
      throw new Error(`Failed to save transcription history: ${error.message}`);
    }
  },

  // Delete a transcription
  deleteTranscription: (id) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const transcriptions = stored ? JSON.parse(stored) : [];
      const filtered = transcriptions.filter(t => t.id !== id);
      
      if (transcriptions.length === filtered.length) {
        return false;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new Event(EVENT_KEY));
      
      return true;
    } catch (error) {
      console.error('Error deleting transcription:', error);
      throw error;
    }
  }
};