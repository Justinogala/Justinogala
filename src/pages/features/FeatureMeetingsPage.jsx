
import React from 'react';
import { Calendar, Users, Clock, Video } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureMeetingsPage = () => {
  return (
    <FeaturePageLayout
      title="Meetings"
      subtitle="Smart Meeting Management"
      description="Streamline your entire meeting lifecycle—from scheduling to follow-ups. Ensure every meeting is productive, documented, and actionable."
      heroImage={`${API_URL}/api/static/feature_meetings.png`}
      benefits={[
        { icon: Calendar, title: "Easy Scheduling", description: "Schedule meetings in seconds with smart calendar integration." },
        { icon: Video, title: "Seamless Hosting", description: "Launch video calls instantly with one click." },
        { icon: Clock, title: "Time Saving", description: "Automated agendas and follow-ups save hours per week." }
      ]}
      features={[
        { title: "Smart Invitations", description: "Send professional calendar invites with dynamic agenda templates." },
        { title: "Meeting Recording", description: "Automatically record every session for future reference." },
        { title: "Participant Management", description: "Easily manage attendees, permissions, and roles." },
        { title: "Interactive Agendas", description: "Collaborative real-time notes and agenda items during calls." }
      ]}
      useCases={[
        { title: "Daily Standups", description: "Keep agile teams aligned with quick, documented syncs." },
        { title: "Client Presentations", description: "Deliver professional pitches with seamless recording." },
        { title: "Remote Interviews", description: "Capture every candidate response accurately." },
        { title: "Project Planning", description: "Brainstorm and document requirements in real-time." }
      ]}
      prevFeature={{ name: "Overview", link: "/features/overview" }}
      nextFeature={{ name: "Transcriptions", link: "/features/transcriptions" }}
    />
  );
};

export default FeatureMeetingsPage;
