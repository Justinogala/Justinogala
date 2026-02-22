
export const whisperService = {
  transcribeAudio: async (audioFile, apiKey) => {
    if (!apiKey) throw new Error("OpenAI API Key is missing. Please configure it in settings.");

    // File validation
    const maxSize = 25 * 1024 * 1024; // 25MB Whisper limit
    if (audioFile.size > maxSize) {
      throw new Error("File size exceeds 25MB limit for OpenAI Whisper API.");
    }

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", "whisper-1");
    // We request verbose_json to get segment timestamps and other metadata
    formData.append("response_format", "verbose_json"); 

    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Whisper API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Return comprehensive structure
      return {
        text: data.text,
        segments: data.segments || [], 
        duration: data.duration, // in seconds
        language: data.language,
        confidence: 0.95, // Whisper doesn't always provide global confidence, but segments have it
        jobId: `whisper-${Date.now()}`,
        status: 'completed',
        // Metadata not from API but useful to pass through if needed, 
        // though usually the caller handles file metadata.
        raw: data
      };
    } catch (error) {
      console.error("Whisper Transcription Error:", error);
      throw error;
    }
  },

  validateAudioFile: (file) => {
    const validTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 
      'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm'
    ];
    // Also check extension as fallback
    const validExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
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
      message = "Invalid OpenAI API Key. Please check your settings.";
    } else if (error.message.includes("413") || error.message.includes("File size")) {
      message = "File is too large. OpenAI Whisper accepts files up to 25MB.";
    } else if (error.message.includes("429")) {
      message = "Rate limit exceeded. Please try again later.";
    } else if (error.message) {
      message = error.message;
    }

    return {
      status: 'failed',
      error: message
    };
  }
};
