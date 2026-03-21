import React from 'react';
import { Bell, Zap, Filter, Smartphone } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureNotificationsPage = () => {
  return (
    <FeaturePageLayout
      title="Notifications"
      subtitle="Stay in the Loop, Always"
      description="Never miss what matters. Real-time notifications for messages, approvals, meetings, shifts, and more — delivered in-app, via email, or push notifications."
      heroImage="https://images.unsplash.com/photo-1611532736597-de2d4265fba3"
      benefits={[
        { icon: Bell, title: "Real-Time Alerts", description: "Instant notifications the moment something needs your attention." },
        { icon: Filter, title: "Smart Filtering", description: "Customize which notifications you receive and how you receive them." },
        { icon: Zap, title: "Quick Actions", description: "Approve, reply, or dismiss directly from the notification." }
      ]}
      features={[
        { title: "Multi-Channel Delivery", description: "Get notified via in-app popups, email digests, or browser push notifications." },
        { title: "Priority Levels", description: "Critical notifications stand out with distinct styling and sound." },
        { title: "Do Not Disturb", description: "Mute notifications during focus time with scheduled DND windows." },
        { title: "Notification Center", description: "Centralized history of all past notifications with search and filters." }
      ]}
      useCases={[
        { title: "Approval Reminders", description: "Get pinged when approvals need your review before deadlines." },
        { title: "Meeting Alerts", description: "Timely reminders before scheduled meetings with join links." },
        { title: "Shift Changes", description: "Instant alerts when your shift is updated or swap requests come in." },
        { title: "Team Activity", description: "Stay aware of key team updates without constant checking." }
      ]}
      prevFeature={{ name: "IR/SOR Reports", link: "/features/ir-sor" }}
      nextFeature={{ name: "Overview", link: "/features" }}
    />
  );
};

export default FeatureNotificationsPage;
