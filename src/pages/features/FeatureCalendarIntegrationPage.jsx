
import React from 'react';
import { Calendar, RefreshCw, Clock, Bell } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureCalendarIntegrationPage = () => {
  return (
    <FeaturePageLayout
      title="Calendar Integration"
      subtitle="Unified Schedule Management"
      description="Sync perfectly with Google Calendar and Outlook. Never miss a meeting and automate your scheduling workflow entirely."
      heroImage="https://images.unsplash.com/photo-1649433391719-2e784576d044"
      benefits={[
        { icon: RefreshCw, title: "Two-Way Sync", description: "Changes reflect instantly across all platforms." },
        { icon: Calendar, title: "Universal Support", description: "Works with Google, Outlook, and Office 365." },
        { icon: Clock, title: "Time Zone Smart", description: "Handles global teams and time zones automatically." }
      ]}
      features={[
        { title: "Meeting Reminders", description: "Customizable notifications before every call." },
        { title: "Auto-Join", description: "Launch meetings directly from your calendar view." },
        { title: "Availability Sharing", description: "Let others book slots based on your real schedule." },
        { title: "Recurring Events", description: "Set up daily, weekly, or custom recurring meetings." }
      ]}
      useCases={[
        { title: "Scheduling Automation", description: "Eliminate the 'when are you free' email tag." },
        { title: "Conflict Resolution", description: "Prevent double-booking automatically." },
        { title: "Global Coordination", description: "Schedule across 3+ time zones effortlessly." },
        { title: "Meeting Prep", description: "Get nudges to review agendas before calls start." }
      ]}
      prevFeature={{ name: "Voice Chat", link: "/features/voice-chat" }}
      nextFeature={{ name: "Overview", link: "/features/overview" }}
    />
  );
};

export default FeatureCalendarIntegrationPage;
