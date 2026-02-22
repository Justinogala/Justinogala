
export const VIDEO_PLATFORMS = [
  { 
    id: 'jizira', 
    label: 'Jizira', 
    isDefault: true, 
    isRecommended: true, 
    description: 'Premium secure video conferencing (Recommended)',
    iconName: 'Zap'
  },
  { 
    id: 'zoom', 
    label: 'Zoom', 
    description: 'Launch Zoom meeting',
    iconName: 'Monitor'
  },
  { 
    id: 'google-meet', 
    label: 'Google Meet', 
    description: 'Launch Google Meet',
    iconName: 'Users'
  },
  { 
    id: 'microsoft-teams', 
    label: 'Microsoft Teams', 
    description: 'Launch Teams meeting',
    iconName: 'Users'
  },
  { 
    id: 'jitsi', 
    label: 'Jitsi Meet', 
    description: 'Launch Jitsi meeting',
    iconName: 'Monitor'
  },
  { 
    id: 'webrtc', 
    label: 'WebRTC', 
    description: 'Standard browser-based video',
    iconName: 'Video'
  },
  { 
    id: 'custom', 
    label: 'Custom URL', 
    description: 'External link',
    iconName: 'Link'
  }
];

export const DEFAULT_PLATFORM = 'jizira';

// Platforms that require an external URL input
// Jizira is now treated as an external platform requiring a URL
export const EXTERNAL_URL_PLATFORMS = ['jizira', 'zoom', 'google-meet', 'microsoft-teams', 'jitsi', 'custom'];
