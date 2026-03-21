
import React from 'react';
import { Calendar, Clock, Bell, Users } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureCalendarIntegrationPage = () => {
  return (
    <FeaturePageLayout
      title="Calendar"
      subtitle="Munal AI Smart Calendar"
      description="Your all-in-one scheduling hub built right into Munal. Plan meetings, manage shifts, track availability, and stay on top of every event — all from one intelligent calendar."
      heroImage="https://images.unsplash.com/photo-1734945620672-f130427acff7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwY2FsZW5kYXIlMjBhcHAlMjBkYXNoYm9hcmQlMjBzY2hlZHVsaW5nfGVufDB8fHx8MTc3NDExMTcxOXww&ixlib=rb-4.1.0&q=85"
      benefits={[
        { icon: Calendar, title: "Unified View", description: "See meetings, shifts, approvals, and deadlines in one calendar." },
        { icon: Clock, title: "Smart Scheduling", description: "AI suggests the best times based on your team's availability." },
        { icon: Bell, title: "Timely Reminders", description: "Customizable notifications so you never miss an event." }
      ]}
      features={[
        { title: "Drag & Drop Events", description: "Create and reschedule events effortlessly with drag-and-drop." },
        { title: "Team Availability", description: "View your entire team's free and busy slots at a glance." },
        { title: "Recurring Events", description: "Set up daily, weekly, or custom recurring meetings and shifts." },
        { title: "Auto-Join Meetings", description: "Launch video calls directly from your calendar with one click." }
      ]}
      useCases={[
        { title: "Meeting Planning", description: "Find the perfect time for team syncs without back-and-forth." },
        { title: "Shift Coordination", description: "See shift schedules alongside meetings for full-day visibility." },
        { title: "Deadline Tracking", description: "Track approval deadlines and project milestones on your calendar." },
        { title: "Daily Overview", description: "Start each day with a clear view of everything on your plate." }
      ]}
      prevFeature={{ name: "Voice Chat", link: "/features/voice-chat" }}
      nextFeature={{ name: "Overview", link: "/features/overview" }}
    />
  );
};

export default FeatureCalendarIntegrationPage;
