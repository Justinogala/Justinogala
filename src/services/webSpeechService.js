
export const webSpeechService = {
  isSupported: () => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  },

  getRecognition: () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    return recognition;
  },

  /**
   * Simulates transcribing a file. 
   * Web Speech API strictly requires microphone input.
   */
  transcribeFile: async (file) => {
    if (!webSpeechService.isSupported()) {
      throw new Error("Web Speech API is not supported in this browser.");
    }

    // Simulate processing time
    const processingTime = Math.min(Math.max(file.size / 1024 / 100, 2000), 8000); 

    return new Promise((resolve) => {
      setTimeout(() => {
        // Return structured data ready for saving
        resolve({
          text: `[Web Speech API Result]\n\nFilename: ${file.name}\n\nSince the browser's Web Speech API strictly listens to the microphone and cannot process uploaded files directly, this is a simulated result to demonstrate the workflow. In a real-world scenario without a backend, you would need to play this audio file through the speakers and let the microphone capture it.`,
          duration: 120, // Mock duration in seconds
          confidence: 0.98,
          status: 'completed',
          language: 'en-US',
          timestamp: new Date().toISOString()
        });
      }, processingTime);
    });
  },

  convertAudioToWav: async (file) => {
    return file; 
  }
};
