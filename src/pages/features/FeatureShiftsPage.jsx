import React from 'react';
import { Clock, Users, CalendarCheck, Bell } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureShiftsPage = () => {
  return (
    <FeaturePageLayout
      title="Shifts"
      subtitle="Smart Shift Scheduling"
      description="Plan, assign, and manage team shifts with an intuitive visual scheduler. Automated reminders, swap requests, and coverage tracking keep your workforce running smoothly."
      heroImage={`${API_URL}/api/static/feature_shifts.png`}
      benefits={[
        { icon: Clock, title: "Visual Scheduler", description: "Drag-and-drop shift planning with day, week, and month views." },
        { icon: Users, title: "Team Coverage", description: "Ensure adequate staffing with real-time coverage tracking and gap alerts." },
        { icon: Bell, title: "Auto Reminders", description: "Automated shift reminders via email and in-app notifications." }
      ]}
      features={[
        { title: "Shift Templates", description: "Create recurring shift patterns and apply them across weeks and teams." },
        { title: "Swap Requests", description: "Let employees request shift swaps with manager approval workflows." },
        { title: "Availability Tracking", description: "Employees set their availability to simplify scheduling decisions." },
        { title: "Overtime Alerts", description: "Get notified when employees approach overtime thresholds." }
      ]}
      useCases={[
        { title: "Healthcare Teams", description: "Schedule nurses and doctors across 24/7 rotations with compliance." },
        { title: "Retail Staff", description: "Plan floor coverage for peak hours and seasonal demands." },
        { title: "Support Teams", description: "Ensure round-the-clock customer support with balanced scheduling." },
        { title: "Remote Teams", description: "Coordinate across time zones with visual overlap indicators." }
      ]}
      prevFeature={{ name: "eSignature", link: "/features/esignature" }}
      nextFeature={{ name: "IR/SOR Reports", link: "/features/ir-sor" }}
    />
  );
};

export default FeatureShiftsPage;
