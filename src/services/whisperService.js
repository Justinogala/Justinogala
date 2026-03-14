import { getApiUrl, API_URL as API_BASE } from '@/lib/api';

export const whisperService = {
  /**
   * Transcribe audio using the backend API (uses platform's API key)
   */
  transcribeAudio: async (audioFile, language = 'en') => {
    // File validation
    const maxSize = 25 * 1024 * 1024; // 25MB Whisper limit
    if (audioFile.size > maxSize) {
      throw new Error("File size exceeds 25MB limit for OpenAI Whisper API.");
    }

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("language", language);

    try {
      const response = await fetch(`${API_BASE}/api/ai/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Return comprehensive structure matching existing format
      return {
        text: data.text,
        segments: data.segments || [], 
        duration: data.duration,
        language: data.language || language,
        confidence: 0.95,
        jobId: `whisper-${Date.now()}`,
        status: 'completed',
        raw: data
      };
    } catch (error) {
      console.error("Whisper Transcription Error:", error);
      throw error;
    }
  },

  /**
   * Check if transcription service is available
   */
  checkAvailability: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/transcribe/status`);
      if (!response.ok) return { available: false };
      return await response.json();
    } catch {
      return { available: false };
    }
  },

  validateAudioFile: (file) => {
    const validTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 
      'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm'
    ];
    const validExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    const isValidType = validTypes.includes(file.type) || validExtensions.includes(ext);

    if (!isValidType) {
      throw new Error("Invalid file format. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, and webm.");
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new Error("File size exceeds 25MB limit.");
    }

    return true;
  },

  handleTranscriptionError: (error) => {
    let message = "An unknown error occurred during transcription.";
    
    if (error.message.includes("401")) {
      message = "Authentication error. Please contact support.";
    } else if (error.message.includes("413") || error.message.includes("File size")) {
      message = "File is too large. OpenAI Whisper accepts files up to 25MB.";
    } else if (error.message.includes("429")) {
      message = "Rate limit exceeded. Please try again later.";
    } else if (error.message.includes("not configured")) {
      message = "Transcription service is not available. Please contact support.";
    } else if (error.message) {
      message = error.message;
    }

    return {
      status: 'failed',
      error: message
    };
  }
};
