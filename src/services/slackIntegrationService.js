
import { tokenManagementService } from './tokenManagementService';
import { integrationService } from './integrationService';

export const slackIntegrationService = {
  connect: async () => {
    // Simulate OAuth Popup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful auth response
    const mockTokenData = {
      accessToken: `xoxb-mock-slack-token-${Date.now()}`,
      refreshToken: `xoxr-mock-slack-refresh-${Date.now()}`,
      scope: 'channels:read,chat:write,users:read',
      expiresIn: 3600 * 24 * 30 // 30 days
    };

    tokenManagementService.storeToken('slack', mockTokenData);
    integrationService.updateSettings('slack', { defaultChannel: '#general' });
    
    return { success: true };
  },

  getChannels: async () => {
    if (!tokenManagementService.hasValidToken('slack')) throw new Error("Slack not connected");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      { id: 'C01', name: '#general' },
      { id: 'C02', name: '#random' },
      { id: 'C03', name: '#project-munal' },
      { id: 'C04', name: '#announcements' }
    ];
  },

  sendMessage: async (channelId, message) => {
    if (!tokenManagementService.hasValidToken('slack')) throw new Error("Slack not connected");
    
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log(`[Slack] Sending to ${channelId}:`, message);
    return { success: true, ts: Date.now() };
  }
};
