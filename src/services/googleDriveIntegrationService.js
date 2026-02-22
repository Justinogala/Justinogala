
import { tokenManagementService } from './tokenManagementService';
import { integrationService } from './integrationService';

export const googleDriveIntegrationService = {
  connect: async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTokenData = {
      accessToken: `ya29.mock-google-token-${Date.now()}`,
      refreshToken: `1//mock-google-refresh-${Date.now()}`,
      scope: 'https://www.googleapis.com/auth/drive.file',
      expiresIn: 3600
    };

    tokenManagementService.storeToken('google_drive', mockTokenData);
    integrationService.updateSettings('google_drive', { folderName: 'Munal Recordings' });
    
    return { success: true };
  },

  listFiles: async () => {
    if (!tokenManagementService.hasValidToken('google_drive')) throw new Error("Google Drive not connected");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: 'g1', name: 'Meeting Notes - Q1.pdf', mimeType: 'application/pdf' },
      { id: 'g2', name: 'Product Sync.mp4', mimeType: 'video/mp4' }
    ];
  },

  uploadFile: async (file, fileName) => {
    if (!tokenManagementService.hasValidToken('google_drive')) throw new Error("Google Drive not connected");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`[GoogleDrive] Uploading ${fileName}`);
    return { success: true, fileId: `g_new_${Date.now()}` };
  }
};
