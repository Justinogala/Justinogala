
import { v4 as uuidv4 } from 'uuid';
import { whisperService } from './whisperService';
import { transcriptionHistoryService } from './transcriptionHistoryService';
import { transcriptionDataSync } from '@/utils/transcriptionDataSync';
import { generateTranscriptionNotification } from '@/utils/notificationGenerators';

export const transcriptionService = {
  // Main method to orchestrate transcription - NO API KEY REQUIRED (uses backend)
  createTranscription: async (file, metadata) => {
    const newId = uuidv4();
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const fileType = file.type || 'audio/' + file.name.split('.').pop();

    try {
      // 1. Validate
      whisperService.validateAudioFile(file);
      
      // 2. Transcribe via backend (uses platform API key)
      const result = await whisperService.transcribeAudio(file, metadata.language || 'en');

      // 3. Format result into application domain model
      const transcriptionData = {
        id: newId,
        title: metadata.title || file.name,
        fileName: file.name,
        fileSize: fileSizeMB,
        fileType: fileType,
        uploadDate: new Date().toISOString(),
        duration: result.duration ? Math.round(result.duration) + 's' : 'Unknown',
        status: 'Completed',
        transcribedText: result.text,
        language: result.language || metadata.language || 'en',
        confidence: result.confidence || 0.95,
        provider: 'openai',
        rawResult: result,
        insights: null,
        actionItems: []
      };
      
      // NOTIFICATION TRIGGER
      generateTranscriptionNotification(transcriptionData.title, transcriptionData.id);

      return transcriptionData;

    } catch (error) {
      console.error("Transcription process failed:", error);
      const handledError = whisperService.handleTranscriptionError(error);
      throw new Error(handledError.error);
    }
  },

  // Check if transcription is available
  checkAvailability: async () => {
    return whisperService.checkAvailability();
  },

  // Save with validation
  saveTranscription: async (data) => {
    // 1. Normalize
    const normalized = transcriptionDataSync.normalizeTranscription(data);
    
    // 2. Validate
    const validation = transcriptionDataSync.validateTranscriptionData(normalized);
    if (!validation.valid) {
      console.error("Validation failed:", validation.errors);
      throw new Error(`Invalid transcription data: ${validation.errors.join(', ')}`);
    }

    // 3. Backup before save (safety)
    transcriptionDataSync.createBackup();

    // 4. Save
    try {
      const saved = transcriptionHistoryService.saveTranscription(normalized);
      
      // 5. Verify
      if (!transcriptionDataSync.verifyPersistence(saved.id)) {
         throw new Error("Save verification failed. Data not found in storage.");
      }
      
      return saved;
    } catch (error) {
      console.error("Save failed, attempting recovery...", error);
      throw error;
    }
  },

  getTranscriptionById: async (id) => {
    return transcriptionHistoryService.getTranscriptionById(id);
  },

  deleteTranscription: async (id) => {
    return transcriptionHistoryService.deleteTranscription(id);
  },
  
  updateTranscription: async (id, updates) => {
    const current = transcriptionHistoryService.getTranscriptionById(id);
    if (!current) throw new Error("Transcription not found");
    const merged = { ...current, ...updates };
    return transcriptionService.saveTranscription(merged);
  },

  saveAdditionalData: async (id, type, data) => {
    const current = transcriptionHistoryService.getTranscriptionById(id);
    if (!current) throw new Error("Transcription not found");

    const updates = { ...current, [type]: data };
    return transcriptionService.saveTranscription(updates);
  }
};

// Export standalone function for backward compatibility and direct usage
export const transcribeAudio = async (file, language = 'en') => {
  const metadata = {
    title: file.name,
    language: language
  };
  
  // Use the main service method to create the transcription
  const transcriptionData = await transcriptionService.createTranscription(file, metadata);
  
  // Save the result automatically
  await transcriptionService.saveTranscription(transcriptionData);
  
  return transcriptionData;
};
