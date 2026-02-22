
import { assemblyAIService } from './assemblyAIService';
import { transcriptionConfigService } from './transcriptionConfigService';

/**
 * Registry and abstract interface for transcription providers.
 * Allows switching between providers (AssemblyAI, Google, etc.).
 */

const providers = {
  assemblyai: assemblyAIService,
  // google: googleSpeechService, // Placeholder
  // deepgram: deepgramService    // Placeholder
};

export const transcriptionProviderService = {
  
  getActiveProvider: () => {
    // Logic to find the first enabled and active provider
    // In a real app, users might select a "preferred" provider
    const configs = transcriptionConfigService.getAllConfigs();
    
    // Default to AssemblyAI for this demo if enabled
    if (configs.assemblyai?.enabled && configs.assemblyai?.status === 'active') {
      return { id: 'assemblyai', service: providers.assemblyai };
    }
    
    // Fallback or find others
    const activeId = Object.keys(configs).find(id => configs[id].enabled && configs[id].status === 'active');
    
    if (activeId && providers[activeId]) {
      return { id: activeId, service: providers[activeId] };
    }
    
    throw new Error('No active transcription providers configured');
  },

  listAvailableProviders: () => {
    return Object.keys(providers);
  },

  transcribe: async (file, options = {}, onProgress) => {
    const { id, service } = transcriptionProviderService.getActiveProvider();
    console.log(`Starting transcription with provider: ${id}`);

    try {
      // 1. Upload
      const uploadUrl = await service.uploadFile(file, onProgress);
      
      // 2. Request Transcription
      const initialResponse = await service.requestTranscription(uploadUrl, options);
      
      return {
        providerId: id,
        jobId: initialResponse.id,
        status: initialResponse.status
      };
    } catch (error) {
      console.error(`Provider ${id} failed:`, error);
      throw error; 
      // Future: Implement automatic fallback logic here
    }
  },

  checkStatus: async (providerId, jobId) => {
    const service = providers[providerId];
    if (!service) throw new Error('Invalid provider ID');
    return await service.getTranscriptionStatus(jobId);
  },

  waitForCompletion: async (providerId, jobId, onUpdate) => {
     const service = providers[providerId];
     if (!service) throw new Error('Invalid provider ID');
     return await service.pollTranscription(jobId, onUpdate);
  }
};
