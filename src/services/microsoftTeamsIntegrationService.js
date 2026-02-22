
import { tokenManagementService } from './tokenManagementService';
import { integrationService } from './integrationService';

export const microsoftTeamsIntegrationService = {
  connect: async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTokenData = {
      accessToken: `eyJ0eXAi...mock-teams-token-${Date.now()}`,
      scope: 'ChannelMessage.Send User.Read',
      expiresIn: 3600
    };

    tokenManagementService.storeToken('msteams', mockTokenData);
    
    return { success: true };
  },

  getTeams: async () => {
    if (!tokenManagementService.hasValidToken('msteams')) throw new Error("Teams not connected");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: 't1', displayName: 'Engineering' },
      { id: 't2', displayName: 'Sales' }
    ];
  },

  sendMessage: async (teamId, channelId, message) => {
    if (!tokenManagementService.hasValidToken('msteams')) throw new Error("Teams not connected");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[Teams] Sending to ${teamId}/${channelId}:`, message);
    return { success: true };
  }
};
