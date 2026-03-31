
import React from 'react';
import { FileText, Mic, Search, Globe } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureTranscriptionsPage = () => {
  return (
    <FeaturePageLayout
      title="Transcriptions"
      subtitle="AI-Powered Transcriptions"
      description="Turn your voice conversations into accurate, searchable text instantly. Never take manual notes again and capture every detail with precision."
      heroImage={`${API_URL}/api/static/feature_transcriptions.png`}
      benefits={[
        { icon: Mic, title: "99% Accuracy", description: "State-of-the-art AI models ensure precise speech-to-text conversion." },
        { icon: Globe, title: "Multi-language", description: "Support for over 30+ languages and dialects." },
        { icon: Search, title: "Fully Searchable", description: "Find any spoken word or phrase in milliseconds." }
      ]}
      features={[
        { title: "Speaker Identification", description: "Automatically distinguishes between different speakers in the conversation." },
        { title: "Real-time Transcription", description: "See the text appear live as people speak during the meeting." },
        { title: "Smart Editing", description: "Correct and highlight text easily with the built-in editor." },
        { title: "Export Options", description: "Download as PDF, DOCX, SRT, or TXT formats instantly." }
      ]}
      useCases={[
        { title: "Meeting Documentation", description: "Create perfect minutes without lifting a finger." },
        { title: "Content Creation", description: "Repurpose webinars and podcasts into blog posts." },
        { title: "Accessibility", description: "Provide captions for deaf and hard-of-hearing team members." },
        { title: "Compliance", description: "Maintain accurate records of all verbal agreements." }
      ]}
      prevFeature={{ name: "Meetings", link: "/features/meetings" }}
      nextFeature={{ name: "Video Conferencing", link: "/features/video-conferencing" }}
    />
  );
};

export default FeatureTranscriptionsPage;
