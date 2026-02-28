
/**
 * Utility service to handle launching video conferences based on platform
 */
export const launchMeeting = (meeting, navigate, toast) => {
  const { platform = 'jizira', meetingUrl, id } = meeting;

  try {
    switch (platform) {
      case 'internal': // Legacy support
      case 'webrtc':
        // WebRTC uses the workspace meeting route
        if (navigate) {
          navigate(`/workspace/meeting/${id}`);
        }
        return true;

      case 'jizira':
      case 'zoom':
      case 'google-meet':
      case 'microsoft-teams':
      case 'jitsi':
      case 'custom':
        if (meetingUrl && (meetingUrl.startsWith('http://') || meetingUrl.startsWith('https://'))) {
          window.open(meetingUrl, '_blank', 'noopener,noreferrer');
          return true;
        } else {
          // If no external URL, use workspace meeting route
          if (navigate) {
            navigate(`/workspace/meeting/${id}`);
          }
          return true;
        }

      default:
        // Default to workspace meeting route
        if (navigate) {
          navigate(`/workspace/meeting/${id}`);
        }
        return true;
    }
  } catch (error) {
    console.error("Error launching meeting:", error);
    if (toast) {
      toast({
        title: "Launch Error",
        description: "Failed to launch the meeting.",
        variant: "destructive"
      });
    }
    return false;
  }
};

export const getPlatformLabel = (platform) => {
  switch (platform) {
    case 'jizira': return 'Jizira';
    case 'zoom': return 'Zoom';
    case 'google-meet': return 'Google Meet';
    case 'microsoft-teams': return 'Microsoft Teams';
    case 'jitsi': return 'Jitsi Meet';
    case 'webrtc': return 'WebRTC';
    case 'custom': return 'External Link';
    case 'internal': return 'Munal Video'; // Legacy
    default: return 'Munal Call';
  }
};
