
export const googleSpeechService = {
  transcribeAudio: async (audioFile, apiKey) => {
    if (!apiKey) throw new Error("Google Cloud API Key is missing");

    // Note: Direct browser-to-Google-Speech-API often requires complex auth (OAuth2) or a proxy.
    // API Keys restrict usage but typically this API prefers gRPC or backend calls for long audio.
    // This implementation assumes a REST usage pattern compatible with API Keys for short audio or demo purposes.
    // Real production usage usually needs a backend proxy to handle LongRunningRecognize.

    // Converting File to Base64 for inline JSON payload (Synchronous Recognize limit ~1 min)
    // For longer files, we'd need to upload to GCS first, which requires more permission setup.
    // This is a simplified client-side implementation.
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      reader.onload = async () => {
        const base64Audio = reader.result.split(',')[1];

        try {
          const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              config: {
                languageCode: "en-US",
                enableAutomaticPunctuation: true
              },
              audio: {
                content: base64Audio
              }
            })
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Google Speech API failed");
          }

          const data = await response.json();
          
          if (!data.results) {
             resolve({
               transcription: "(No speech detected or audio too short)",
               confidence: 0,
               alternatives: [],
               status: 'completed'
             });
             return;
          }

          const transcription = data.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
          
          const confidence = data.results[0].alternatives[0].confidence;

          resolve({
            transcription,
            confidence,
            alternatives: data.results[0].alternatives,
            duration: 'Unknown (Google Sync API)',
            jobId: `google-${Date.now()}`,
            status: 'completed'
          });

        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
    });
  },

  getTranscriptionStatus: async (jobId) => {
    return 'completed';
  },

  cancelTranscription: (jobId) => {
    return true;
  }
};
