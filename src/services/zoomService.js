
// Mock Zoom Service

const CLIENT_ID = import.meta.env.VITE_ZOOM_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_ZOOM_REDIRECT_URI;

export const getZoomAuthUrl = () => {
  return `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
};

export const handleZoomCallback = async (code) => {
  console.log('Handling Zoom Callback with code:', code);
  // Mock token exchange
  return {
    access_token: 'mock_zoom_access_token',
    refresh_token: 'mock_zoom_refresh_token',
    expires_in: 3600
  };
};

export const listZoomMeetings = async (userId) => {
  // Mock data
  return [
    { id: '123', topic: 'Weekly Sync', start_time: new Date().toISOString(), duration: 60, join_url: '#' },
    { id: '456', topic: 'Project Review', start_time: new Date().toISOString(), duration: 30, join_url: '#' }
  ];
};

export const startZoomRecording = async (meetingId) => {
  console.log(`Starting recording for meeting ${meetingId}`);
  return { status: 'recording_started' };
};

export const stopZoomRecording = async (meetingId) => {
  console.log(`Stopping recording for meeting ${meetingId}`);
  return { status: 'recording_stopped' };
};

export const getZoomRecording = async (recordingId) => {
  return { 
    id: recordingId, 
    download_url: '#', 
    file_type: 'MP4' 
  };
};

export const downloadZoomRecording = async (recordingId) => {
  console.log('Downloading recording:', recordingId);
  return new Blob(['mock video content'], { type: 'video/mp4' });
};

export const subscribeToZoomWebhooks = async () => {
  console.log('Subscribing to Zoom webhooks...');
  return { success: true };
};
