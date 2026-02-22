
import React from 'react';
import { Video, Monitor, Users, Shield } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureVideoConferencingPage = () => {
  return (
    <FeaturePageLayout
      title="Video Conferencing"
      subtitle="Crystal Clear Video Calls"
      description="Experience high-definition video meetings designed for collaboration. Connect with your team from anywhere with reliable, secure conferencing."
      heroImage="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b"
      benefits={[
        { icon: Video, title: "HD Quality", description: "Crisp 1080p video and crystal clear audio fidelity." },
        { icon: Monitor, title: "Screen Sharing", description: "Share your screen, window, or specific tab easily." },
        { icon: Shield, title: "Secure Encryption", description: "End-to-end encryption keeps your conversations private." }
      ]}
      features={[
        { title: "Virtual Backgrounds", description: "Blur your background or choose a professional image." },
        { title: "Breakout Rooms", description: "Split large meetings into smaller discussion groups." },
        { title: "Meeting Chat", description: "Integrated chat for links and comments without interrupting." },
        { title: "Interactive Controls", description: "Raise hand, mute/unmute, and moderator controls." }
      ]}
      useCases={[
        { title: "Remote Team Syncs", description: "Connect distributed teams face-to-face effortlessly." },
        { title: "Client Webinars", description: "Host professional presentations for external stakeholders." },
        { title: "Training Sessions", description: "Conduct interactive workshops with screen sharing." },
        { title: "Virtual Events", description: "Host large-scale company all-hands meetings." }
      ]}
      prevFeature={{ name: "Transcriptions", link: "/features/transcriptions" }}
      nextFeature={{ name: "Search", link: "/features/search" }}
    />
  );
};

export default FeatureVideoConferencingPage;
