import React from 'react';
import { CircleDot, Mic, Clock, FileText } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureQuickRecordPage = () => {
  return (
    <FeaturePageLayout
      title="Quick Record"
      subtitle="Capture Ideas Instantly"
      description="One tap to start recording. Quick Record captures your voice memos, meeting snippets, and spontaneous ideas — then AI transcribes and organizes them automatically."
      heroImage="https://images.unsplash.com/photo-1635520356736-90cb46f73413?w=800&q=80"
      benefits={[
        { icon: CircleDot, title: "One-Tap Recording", description: "Start recording instantly with a single tap — no setup, no delays, just capture." },
        { icon: Mic, title: "High-Quality Audio", description: "Crystal-clear recording optimized for voice, even in noisy environments." },
        { icon: FileText, title: "Auto Transcription", description: "Every recording is automatically transcribed with AI-powered accuracy." }
      ]}
      features={[
        { title: "Instant Start", description: "Open the app and tap record — capture thoughts before they slip away." },
        { title: "Background Recording", description: "Continue recording while using other apps on your device." },
        { title: "Smart Tags", description: "AI automatically tags and categorizes recordings by topic and context." },
        { title: "Cloud Sync", description: "Recordings sync instantly to your Munal dashboard for desktop access." }
      ]}
      useCases={[
        { title: "Meeting Quick Notes", description: "Record ad-hoc discussions and hallway conversations for later reference." },
        { title: "Voice Memos", description: "Capture ideas, reminders, and to-dos on the go without typing." },
        { title: "Lecture Recording", description: "Record lectures and seminars with automatic transcription." },
        { title: "Interview Capture", description: "Record interviews and let AI extract key insights and action items." }
      ]}
      prevFeature={{ name: "Text to Video", link: "/features/text-to-video" }}
      nextFeature={{ name: "AI Transcriptions", link: "/features/transcriptions" }}
    />
  );
};

export default FeatureQuickRecordPage;
