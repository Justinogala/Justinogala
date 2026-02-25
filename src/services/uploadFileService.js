
import { fileService } from './fileService';
import { validateFile } from './fileValidation';
import { messagingService } from './messagingService';

/**
 * Service to handle file upload operations.
 */
export const uploadFileService = {
  /**
   * Upload a file with validation and progress tracking
   * @param {File} file - The file to upload
   * @param {string} bucket - Target bucket (default: 'documents')
   * @param {Function} onProgress - Progress callback (percentage)
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  uploadFile: async (file, bucket = 'documents', onProgress) => {
    try {
      // 1. Validate File
      let typeCategory = 'document';
      if (file.type.startsWith('audio/')) typeCategory = 'audio';
      else if (file.type.startsWith('video/')) typeCategory = 'video';
      else if (file.type.startsWith('image/')) typeCategory = 'image';

      const validation = validateFile(file, typeCategory);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 2. Perform Upload
      const path = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}`;
      const result = await fileService.uploadFile(file, bucket, path, onProgress);

      if (result.success) {
        // Enrich result with metadata
        return {
          success: true,
          data: {
            ...result.data,
            type: typeCategory,
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString()
          }
        };
      }

      return result;
    } catch (error) {
      console.error('Upload service error:', error);
      return { success: false, error: 'An unexpected error occurred during upload.' };
    }
  },

  /**
   * Save reference to a file in persistent storage (linked to message)
   * In this LS implementation, this is handled by saving the message with attachments.
   * This method acts as a helper/placeholder for future backend integration.
   */
  saveFileReference: async (fileData, messageId) => {
    // In a real DB, insert into 'attachments' table
    return true; 
  },

  /**
   * Retrieve all files associated with a conversation
   */
  getFilesByConversationId: async (conversationId) => {
    const messages = await messagingService.getConversationHistory(conversationId);
    const files = messages.flatMap(m => m.attachments || []);
    return files;
  },

  /**
   * Retrieve all files for a specific message
   */
  getFilesByMessageId: async (messageId) => {
    return await messagingService.getMessageAttachments(messageId);
  },

  /**
   * Get recent files for a user
   */
  getRecentFiles: async (userId, limit = 10) => {
    // Return empty array for now - can be implemented with backend later
    return [];
  }
};
