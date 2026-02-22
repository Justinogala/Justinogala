
import { v4 as uuidv4 } from 'uuid';

// Mock delay to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const FILES_KEY = 'munal_files_metadata';

/**
 * Service to handle file operations.
 * Currently implements a localStorage-based mock to satisfy prototyping constraints,
 * but structured to be easily replaced with Supabase Storage calls.
 */
export const fileService = {
  
  /**
   * Upload a file
   * @param {File} file - The file object
   * @param {string} bucket - 'audio-files', 'video-files', 'documents', 'avatars'
   * @param {string} path - Folder structure (e.g., workplace_id/meeting_id)
   * @param {function} onProgress - Callback for progress (0-100)
   */
  uploadFile: async (file, bucket, path, onProgress) => {
    try {
      // Simulate network request start
      await delay(500);

      // Simulate progress
      if (onProgress) {
        for (let i = 10; i <= 100; i += 20) {
          onProgress(i);
          await delay(200);
        }
      }

      // In a real app, we would upload to Supabase here:
      // const { data, error } = await supabase.storage.from(bucket).upload(`${path}/${file.name}`, file);

      // For prototype: Store metadata in localStorage
      const fileId = uuidv4();
      const metadata = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        bucket,
        path: `${path}/${file.name}`,
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file) // Note: This URL is temporary and only valid for the current session!
      };

      const existingFiles = JSON.parse(localStorage.getItem(FILES_KEY) || '[]');
      existingFiles.push(metadata);
      localStorage.setItem(FILES_KEY, JSON.stringify(existingFiles));

      return { success: true, data: metadata };
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Download a file
   */
  downloadFile: async (bucket, path) => {
    await delay(1000);
    // Mock: just return success, we can't really download the binary from localstorage
    return { success: true, message: 'File downloaded (mock)' };
  },

  /**
   * Generate a signed URL for private access
   */
  generateSignedUrl: async (bucket, path, expiresIn = 3600) => {
    await delay(500);
    // Mock: Return a dummy URL
    return { 
      success: true, 
      signedUrl: `https://mock-storage.munal.com/${bucket}/${path}?token=mock-token` 
    };
  },
  
  /**
   * Get public URL (for avatars)
   */
  getPublicUrl: (bucket, path) => {
    return {
      publicUrl: `https://mock-storage.munal.com/${bucket}/${path}`
    };
  },

  /**
   * List files based on criteria (simulating a database query)
   */
  listFiles: async ({ bucket, fileType, workplaceId }) => {
    await delay(800);
    const allFiles = JSON.parse(localStorage.getItem(FILES_KEY) || '[]');
    
    let filtered = allFiles;
    if (bucket) filtered = filtered.filter(f => f.bucket === bucket);
    if (fileType) filtered = filtered.filter(f => f.type.includes(fileType));
    
    // Sort by newest first
    filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    return { success: true, data: filtered };
  },

  /**
   * Delete a file
   */
  deleteFile: async (fileId) => {
    await delay(600);
    const allFiles = JSON.parse(localStorage.getItem(FILES_KEY) || '[]');
    const newFiles = allFiles.filter(f => f.id !== fileId);
    
    if (allFiles.length === newFiles.length) {
      return { success: false, error: 'File not found' };
    }
    
    localStorage.setItem(FILES_KEY, JSON.stringify(newFiles));
    return { success: true };
  },

  /**
   * Get metadata
   */
  getFileMetadata: async (fileId) => {
    await delay(300);
    const allFiles = JSON.parse(localStorage.getItem(FILES_KEY) || '[]');
    const file = allFiles.find(f => f.id === fileId);
    
    if (!file) return { success: false, error: 'File not found' };
    return { success: true, data: file };
  }
};
