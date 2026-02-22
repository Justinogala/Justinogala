
import { tokenManagementService } from './tokenManagementService';
import { integrationService } from './integrationService';

export const dropboxIntegrationService = {
  connect: async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTokenData = {
      accessToken: `sl.mock-dropbox-token-${Date.now()}`,
      refreshToken: `mock-dropbox-refresh-${Date.now()}`,
      expiresIn: 14400 // 4 hours
    };

    tokenManagementService.storeToken('dropbox', mockTokenData);
    integrationService.updateSettings('dropbox', { syncFolder: '/Munal' });
    
    return { success: true };
  },

  listFiles: async () => {
    if (!tokenManagementService.hasValidToken('dropbox')) throw new Error("Dropbox not connected");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: 'd1', name: 'Contract.pdf', size: 102450 },
      { id: 'd2', name: 'Transcript_2024.docx', size: 4500 }
    ];
  },

  uploadFile: async (file, path) => {
    if (!tokenManagementService.hasValidToken('dropbox')) throw new Error("Dropbox not connected");
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`[Dropbox] Uploading to ${path}`);
    return { success: true, path: path };
  }
};
