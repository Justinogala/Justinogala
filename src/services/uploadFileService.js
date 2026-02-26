
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
  getRecentFiles: async (limit = 5) => {
    try {
      const result = await fileService.listFiles({});
      if (result.success) {
        // Return only the most recent files up to the limit
        return { success: true, data: result.data.slice(0, limit) };
      }
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error getting recent files:', error);
      return { success: true, data: [] };
    }
  },

  /**
   * Get storage statistics for the current user
   */
  getStorageStats: async () => {
    try {
      const result = await fileService.listFiles({});
      if (result.success) {
        const totalUsed = result.data.reduce((sum, file) => sum + (file.size || 0), 0);
        // Default quota of 5GB
        const totalQuota = 5 * 1024 * 1024 * 1024;
        return { success: true, used: totalUsed, total: totalQuota };
      }
      return { success: true, used: 0, total: 5 * 1024 * 1024 * 1024 };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { success: true, used: 0, total: 5 * 1024 * 1024 * 1024 };
    }
  }
};
