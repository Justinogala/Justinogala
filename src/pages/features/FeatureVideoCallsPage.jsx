import React from 'react';
import { Video, Shield, Users, Mic } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureVideoCallsPage = () => {
  return (
    <FeaturePageLayout
      title="Video Calls"
      subtitle="Crystal-Clear Video Conferencing"
      description="Connect face-to-face with your team anywhere in the world. High-quality video calls with screen sharing, recording, and real-time collaboration built right in."
      heroImage="https://images.unsplash.com/photo-1609619385002-f40f1df9b5a4"
      benefits={[
        { icon: Video, title: "HD Video & Audio", description: "Crystal-clear video with adaptive quality that adjusts to your bandwidth." },
        { icon: Users, title: "Group Calls", description: "Host meetings with up to 100 participants with gallery and speaker views." },
        { icon: Shield, title: "End-to-End Encryption", description: "Enterprise-grade security ensures your conversations stay private." }
      ]}
      features={[
        { title: "Screen Sharing", description: "Share your screen, specific windows, or tabs with one click during any call." },
        { title: "Call Recording", description: "Record important calls and access them anytime from your dashboard." },
        { title: "Virtual Backgrounds", description: "Professional backgrounds and blur effects for any environment." },
        { title: "Live Reactions", description: "React with emojis, raise your hand, and engage without interrupting." }
      ]}
      useCases={[
        { title: "Remote Team Syncs", description: "Keep distributed teams connected with seamless daily standups." },
        { title: "Client Demos", description: "Present and pitch with professional video and screen sharing." },
        { title: "Training Sessions", description: "Conduct interactive training with recording for later review." },
        { title: "1-on-1 Check-ins", description: "Build relationships with personalized face-to-face conversations." }
      ]}
      prevFeature={{ name: "Meetings", link: "/features/meetings" }}
      nextFeature={{ name: "Approvals", link: "/features/approvals" }}
    />
  );
};

export default FeatureVideoCallsPage;
