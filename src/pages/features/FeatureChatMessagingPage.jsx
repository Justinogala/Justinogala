
import React from 'react';
import { MessageSquare, Share2, Smile, Bell } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureChatMessagingPage = () => {
  return (
    <FeaturePageLayout
      title="Chat & Messaging"
      subtitle="Seamless Team Communication"
      description="Keep the conversation going before, during, and after meetings. A centralized hub for all your team's text-based collaboration."
      heroImage="https://images.unsplash.com/photo-1531497258014-b5736f376b1b"
      benefits={[
        { icon: MessageSquare, title: "Instant Messaging", description: "Real-time direct messages and group channels." },
        { icon: Share2, title: "File Sharing", description: "Drag and drop files to share instantly with the team." },
        { icon: Bell, title: "Smart Notifications", description: "Stay updated without being overwhelmed." }
      ]}
      features={[
        { title: "Threaded Conversations", description: "Keep discussions organized with reply threads." },
        { title: "Emoji Reactions", description: "Express feedback quickly and build team culture." },
        { title: "Message Search", description: "Easily find past decisions and shared links." },
        { title: "Rich Text Editing", description: "Format your messages with bold, code blocks, and lists." }
      ]}
      useCases={[
        { title: "Team Updates", description: "Share daily progress without scheduling a meeting." },
        { title: "Quick Questions", description: "Get immediate answers from colleagues." },
        { title: "File Collaboration", description: "Discuss documents and designs in context." },
        { title: "Remote Culture", description: "Social channels for distributed team bonding." }
      ]}
      prevFeature={{ name: "Search", link: "/features/search" }}
      nextFeature={{ name: "Teams", link: "/features/teams" }}
    />
  );
};

export default FeatureChatMessagingPage;
