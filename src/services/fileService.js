import { v4 as uuidv4 } from 'uuid';

import { getApiUrl, API_URL } from '@/lib/api';

/**
 * Get the API URL with fallback
 */

/**
 * Service to handle file operations using backend GridFS storage.
 */
export const fileService = {
  
  /**
   * Upload a file to backend GridFS
   * @param {File} file - The file object
   * @param {string} bucket - 'audio-files', 'video-files', 'documents', 'avatars'
   * @param {string} path - Folder structure (e.g., workplace_id/meeting_id)
   * @param {function} onProgress - Callback for progress (0-100)
   */
  uploadFile: async (file, bucket, path, onProgress) => {
    const apiUrl = getApiUrl();
    
    try {
      // Get user ID from localStorage
      const userData = localStorage.getItem('munal_auth');
      const user = userData ? JSON.parse(userData) : null;
      const userId = user?.id || 'anonymous';

      // Start progress
      if (onProgress) onProgress(10);

      // Use multipart file upload (supports both file and base64 on backend)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId);
      formData.append('category', bucket);

      const response = await fetch(`${apiUrl}/api/chat/files/upload`, {
        method: 'POST',
        body: formData
      });

      if (onProgress) onProgress(70);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(d => d.msg || d.message || 'Validation error').join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          errorMessage = `Upload failed (status ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const fileData = data.file || {};
      const fileId = fileData.id || data.file_id;
      
      if (onProgress) onProgress(100);

      return { 
        success: true, 
        data: {
          id: fileId,
          name: fileData.file_name || file.name,
          size: fileData.size || file.size,
          type: fileData.content_type || file.type,
          bucket,
          path: `${path}/${file.name}`,
          uploadedAt: fileData.uploaded_at || new Date().toISOString(),
          url: fileData.url || `${apiUrl}/api/chat/files/${fileId}/download`
        }
      };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  },

  /**
   * Download/stream a file
   */
  downloadFile: async (fileId) => {
    const apiUrl = getApiUrl();
    try {
      const response = await fetch(`${apiUrl}/api/chat/files/${fileId}/download`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      console.error('Download error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get file URL for streaming/embedding
   */
  getFileUrl: (fileId) => {
    const apiUrl = getApiUrl();
    return `${apiUrl}/api/chat/files/${fileId}/download`;
  },

  /**
   * Delete a file
   */
  deleteFile: async (fileId, userId) => {
    const apiUrl = getApiUrl();
    try {
      const userData = localStorage.getItem('munal_auth');
      const user = userData ? JSON.parse(userData) : null;
      const actualUserId = userId || user?.id || 'anonymous';

      const response = await fetch(`${apiUrl}/api/chat/files/${fileId}?user_id=${actualUserId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get file metadata (for backwards compatibility)
   */
  getFileMetadata: async (fileId) => {
    const apiUrl = getApiUrl();
    return { 
      success: true, 
      data: { 
        id: fileId, 
        url: `${apiUrl}/api/chat/files/${fileId}` 
      } 
    };
  },

  /**
   * List all files for the current user
   * @param {Object} options - Filter options (category, etc.)
   */
  listFiles: async (options = {}) => {
    const apiUrl = getApiUrl();
    try {
      // Get user ID from localStorage
      const userData = localStorage.getItem('munal_auth');
      const user = userData ? JSON.parse(userData) : null;
      const userId = user?.id || 'anonymous';

      let url = `${apiUrl}/api/chat/files/user/${userId}`;
      if (options.category) {
        url += `?category=${encodeURIComponent(options.category)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to list files');
      }

      const data = await response.json();
      
      // Transform files to match expected format
      const files = (data.files || []).map(file => ({
        id: file.id,
        name: file.file_name || file.filename,
        size: file.size || file.file_size,
        type: file.content_type,
        category: file.category,
        uploadedAt: file.uploaded_at || file.created_at,
        url: `${apiUrl}/api/chat/files/${file.id}`
      }));

      return { success: true, data: files };
    } catch (error) {
      console.error('List files error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }
};

/**
 * Convert File to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:*/*;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
