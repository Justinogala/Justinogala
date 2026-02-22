
import { v4 as uuidv4 } from 'uuid';

// Mock service for file handling in chat
export const chatFileService = {
  uploadFile: async (file, onProgress) => {
    // Simulate upload process
    const totalSize = file.size;
    let uploaded = 0;
    
    // Simulate chunks
    const chunks = 10;
    const chunkSize = totalSize / chunks;

    for (let i = 0; i <= chunks; i++) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network latency
      uploaded = Math.min(uploaded + chunkSize, totalSize);
      const progress = Math.round((uploaded / totalSize) * 100);
      
      if (onProgress) onProgress(progress);
    }

    // Return mock file object
    return {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Local blob URL for demo
      uploadedAt: new Date().toISOString()
    };
  },

  validateFile: (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 10MB limit");
    }
    return true;
  }
};
