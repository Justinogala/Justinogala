
import { transcriptionConfigService } from './transcriptionConfigService';

/**
 * Service for interacting with AssemblyAI API.
 * Handles upload, transcription request, polling, and result retrieval.
 */

const BASE_URL = 'https://api.assemblyai.com/v2';

export const assemblyAIService = {
  getHeaders: () => {
    const apiKey = transcriptionConfigService.getAssemblyAIApiKey();
    if (!apiKey) {
      const error = new Error('AssemblyAI API Key is missing');
      error.code = 'MISSING_API_KEY';
      throw error;
    }
    return {
      authorization: apiKey,
    };
  },

  uploadAudioFile: async (file) => {
    try {
      const headers = assemblyAIService.getHeaders();
      
      const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: headers,
        body: file
      });

      if (response.status === 401) {
        throw new Error('Invalid API Key. Please check your configuration.');
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.upload_url;
    } catch (error) {
      console.error('AssemblyAI Upload Error:', error);
      throw error;
    }
  },

  submitTranscriptionJob: async (audioUrl, language = 'auto_highlight') => {
    try {
      const headers = assemblyAIService.getHeaders();
      
      const body = {
        audio_url: audioUrl,
        speaker_labels: true,
      };

      if (language && language !== 'auto') {
        body.language_code = language;
      }

      const response = await fetch(`${BASE_URL}/transcript`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.status === 401) {
        throw new Error('Invalid API Key. Please check your configuration.');
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(err.error || 'Failed to start transcription');
      }
      
      return await response.json(); // Returns { id, status, ... }
    } catch (error) {
      console.error('AssemblyAI Start Error:', error);
      throw error;
    }
  },

  getTranscriptionResult: async (transcriptId) => {
    try {
      const headers = assemblyAIService.getHeaders();
      const response = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
        method: 'GET',
        headers: headers
      });

      if (response.status === 401) {
        throw new Error('Invalid API Key. Please check your configuration.');
      }

      if (!response.ok) throw new Error('Failed to retrieve transcription');
      return await response.json();
    } catch (error) {
      console.error('AssemblyAI Result Error:', error);
      throw error;
    }
  },

  pollTranscriptionStatus: async (jobId, onUpdate) => {
    const pollInterval = 2000;
    const maxTime = 10 * 60 * 1000; // 10 minutes timeout
    const startTime = Date.now();

    const check = async () => {
      if (Date.now() - startTime > maxTime) {
        throw new Error('Transcription timed out after 10 minutes');
      }

      try {
        const data = await assemblyAIService.getTranscriptionResult(jobId);
        
        if (onUpdate) onUpdate(data);

        if (data.status === 'completed') {
          return data;
        } else if (data.status === 'error') {
          throw new Error(data.error || 'Transcription failed');
        } else {
          await new Promise(r => setTimeout(r, pollInterval));
          return check();
        }
      } catch (err) {
        throw err;
      }
    };

    return check();
  }
};
