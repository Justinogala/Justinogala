import React from 'react';
import { Volume2, Zap, Globe, Headphones } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureTextToAudioPage = () => {
  return (
    <FeaturePageLayout
      title="Text to Audio"
      subtitle="Transform Text into Natural Speech"
      description="Convert any text into high-quality, natural-sounding audio with AI-powered voices. Perfect for creating podcasts, voiceovers, accessibility content, and audio summaries from your notes."
      heroImage="https://images.unsplash.com/photo-1780642203579-e95141277cf4?w=800&q=80"
      benefits={[
        { icon: Volume2, title: "Natural AI Voices", description: "Choose from a wide range of realistic AI voices with different accents, tones, and languages." },
        { icon: Zap, title: "Instant Generation", description: "Generate audio in seconds — paste your text, pick a voice, and download or stream immediately." },
        { icon: Globe, title: "Multi-Language Support", description: "Create audio content in dozens of languages to reach a global audience effortlessly." }
      ]}
      features={[
        { title: "Voice Customization", description: "Adjust speed, pitch, and emphasis to get exactly the tone and delivery you need." },
        { title: "Meeting Notes to Audio", description: "Convert your meeting summaries and notes into audio for on-the-go review." },
        { title: "Batch Processing", description: "Generate audio for multiple documents at once — ideal for content teams." },
        { title: "Download & Share", description: "Export as MP3 or WAV. Share directly with your team or embed in presentations." }
      ]}
      useCases={[
        { title: "Podcast Creation", description: "Turn blog posts and scripts into professional podcast episodes in minutes." },
        { title: "Accessibility", description: "Make documents and content accessible to visually impaired team members." },
        { title: "Learning Materials", description: "Create audio versions of training content for mobile learning." },
        { title: "Email Summaries", description: "Listen to your daily email digests and meeting recaps while commuting." }
      ]}
      prevFeature={{ name: "AI Chat", link: "/features/ai" }}
      nextFeature={{ name: "Text to Video", link: "/features/text-to-video" }}
    />
  );
};

export default FeatureTextToAudioPage;
