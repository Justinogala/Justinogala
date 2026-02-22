
import React from 'react';
import { Mic, Radio, Headphones, Zap } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureVoiceChatPage = () => {
  return (
    <FeaturePageLayout
      title="Voice Chat"
      subtitle="Instant Voice Collaboration"
      description="Sometimes typing isn't enough. Jump into crystal-clear voice channels for quick syncs, spontaneous ideas, and social hangouts."
      heroImage="https://images.unsplash.com/photo-1667635279278-6018adc775b8"
      benefits={[
        { icon: Zap, title: "Low Latency", description: "Real-time communication with zero lag." },
        { icon: Mic, title: "Crystal Clear", description: "High-fidelity audio ensures every nuance is heard." },
        { icon: Radio, title: "Always On", description: "Drop-in/drop-out channels like a virtual office." }
      ]}
      features={[
        { title: "Noise Cancellation", description: "AI filters out background noise automatically." },
        { title: "Push-to-Talk", description: "Optional PTT mode for noisy environments." },
        { title: "Voice Messages", description: "Send recorded clips when they can't answer live." },
        { title: "Mobile Ready", description: "Stay connected on the go with our mobile app." }
      ]}
      useCases={[
        { title: "Quick Huddles", description: "Solve complex problems faster than typing." },
        { title: "Virtual Watercooler", description: "Casual social channels for remote bonding." },
        { title: "Gaming/Social", description: "Reliable voice chat for team activities." },
        { title: "Accessibility", description: "Voice-first interface for inclusive collaboration." }
      ]}
      prevFeature={{ name: "Analytics", link: "/features/analytics" }}
      nextFeature={{ name: "Calendar Integration", link: "/features/calendar-integration" }}
    />
  );
};

export default FeatureVoiceChatPage;
