
// Mock Teams Service

const CLIENT_ID = import.meta.env.VITE_TEAMS_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_TEAMS_REDIRECT_URI;

export const getTeamsAuthUrl = () => {
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=OnlineMeetings.ReadWrite`;
};

export const handleTeamsCallback = async (code) => {
  console.log('Handling Teams Callback with code:', code);
  return {
    access_token: 'mock_teams_access_token',
    expires_in: 3600
  };
};

export const listTeamsMeetings = async (userId) => {
  return [
    { id: 't1', subject: 'Teams Standup', startDateTime: new Date().toISOString(), joinUrl: '#' }
  ];
};

export const deployTeamsBot = async (teamId) => {
  console.log(`Deploying bot to team ${teamId}`);
  return { botId: 'bot_123', status: 'deployed' };
};

export const startTeamsRecording = async (meetingId) => {
  console.log(`Starting Teams recording for ${meetingId}`);
  return { status: 'started' };
};

export const stopTeamsRecording = async (meetingId) => {
  console.log(`Stopping Teams recording for ${meetingId}`);
  return { status: 'stopped' };
};

export const getTeamsRecording = async (recordingId) => {
  return { id: recordingId, downloadUrl: '#' };
};

export const subscribeToTeamsWebhooks = async () => {
  console.log('Subscribed to Teams webhooks');
  return true;
};
