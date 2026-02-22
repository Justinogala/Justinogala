
import { tokenManagementService } from './tokenManagementService';
import { integrationService } from './integrationService';

export const zapierIntegrationService = {
  connect: async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTokenData = {
      accessToken: `zap-mock-token-${Date.now()}`,
      refreshToken: `zap-refresh-${Date.now()}`,
      expiresIn: 3600 * 24 * 365 // Long lived
    };

    tokenManagementService.storeToken('zapier', mockTokenData);
    
    return { success: true };
  },

  getZaps: async () => {
    if (!tokenManagementService.hasValidToken('zapier')) throw new Error("Zapier not connected");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: 'z1', title: 'New Meeting -> Trello Card', active: true },
      { id: 'z2', title: 'Transcript -> Email Digest', active: false }
    ];
  },

  triggerZap: async (zapId, payload) => {
    if (!tokenManagementService.hasValidToken('zapier')) throw new Error("Zapier not connected");
    
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[Zapier] Triggering ${zapId}`, payload);
    return { success: true };
  }
};
