
import React from 'react';
import { Calendar, Clock, Bell, Users } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureCalendarIntegrationPage = () => {
  return (
    <FeaturePageLayout
      title="Calendar"
      subtitle="Munal AI Smart Calendar"
      description="Your all-in-one scheduling hub built right into Munal. Plan meetings, manage shifts, track availability, and stay on top of every event — all from one intelligent calendar."
      heroImage={`${API_URL}/api/static/feature_calendar.png`}
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
