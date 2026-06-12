import React from 'react';
import { Clapperboard, Sparkles, Film, Share2 } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureTextToVideoPage = () => {
  return (
    <FeaturePageLayout
      title="Text to Video"
      subtitle="Create Stunning Videos from Text"
      description="Transform your ideas, scripts, and meeting summaries into polished video content with AI. No editing skills required — just type and generate."
      heroImage="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80"
      benefits={[
        { icon: Clapperboard, title: "AI Video Generation", description: "Describe your vision in text and watch AI create professional-quality video clips for you." },
        { icon: Sparkles, title: "Smart Scenes", description: "AI automatically selects visuals, transitions, and layouts that match your content." },
        { icon: Film, title: "Multiple Styles", description: "Choose from cinematic, corporate, educational, and creative styles for any audience." }
      ]}
      features={[
        { title: "Script to Video", description: "Paste a script or prompt and get a fully produced video with scenes and transitions." },
        { title: "Meeting Recap Videos", description: "Automatically turn meeting summaries into shareable video highlights." },
        { title: "Custom Branding", description: "Add your logo, colors, and fonts to keep videos on-brand." },
        { title: "Export & Share", description: "Download in HD or share directly to your team's workspace." }
      ]}
      useCases={[
        { title: "Training Videos", description: "Create onboarding and training content from existing documents in minutes." },
        { title: "Social Media", description: "Generate engaging video content for marketing and social channels." },
        { title: "Product Demos", description: "Quickly produce product walkthroughs and demo videos from descriptions." },
        { title: "Weekly Updates", description: "Turn weekly status reports into visual video summaries for stakeholders." }
      ]}
      prevFeature={{ name: "Text to Audio", link: "/features/text-to-audio" }}
      nextFeature={{ name: "Quick Record", link: "/features/quick-record" }}
    />
  );
};

export default FeatureTextToVideoPage;
