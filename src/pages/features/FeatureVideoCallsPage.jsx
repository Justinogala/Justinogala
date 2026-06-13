import React from 'react';
import { Video, Shield, Users, Mic } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const VideoCallMockup = () => (
  <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-800 bg-[#1a1a2e]">
    {/* macOS title bar */}
    <div className="flex items-center px-4 py-2.5 bg-[#232340] border-b border-white/5">
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
      </div>
      <span className="flex-1 text-center text-sm font-medium text-gray-300 tracking-wide">Munal AI</span>
      <div className="w-14" />
    </div>
    {/* Video grid */}
    <div className="grid grid-cols-2 gap-0.5 p-0.5">
      <div className="relative aspect-video">
        <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=75" alt="Participant" className="w-full h-full object-cover" />
        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Admin</span>
      </div>
      <div className="relative aspect-video">
        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=75" alt="Participant" className="w-full h-full object-cover" />
        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Marius Cioorian</span>
      </div>
    </div>
    {/* Controls bar */}
    <div className="flex items-center justify-center gap-4 py-3 bg-[#232340] border-t border-white/5">
      {[Mic, Video, Users, Shield].map((Icon, i) => (
        <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center ${i === 3 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-300'}`}>
          <Icon className="w-4 h-4" />
        </div>
      ))}
      <span className="ml-4 text-xs text-red-400 font-medium">End Meeting</span>
    </div>
  </div>
);

const FeatureVideoCallsPage = () => {
  return (
    <FeaturePageLayout
      title="Video Calls"
      subtitle="Crystal-Clear Video Conferencing"
      description="Connect face-to-face with your team anywhere in the world. High-quality video calls with screen sharing, recording, and real-time collaboration built right in."
      heroComponent={<VideoCallMockup />}
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
