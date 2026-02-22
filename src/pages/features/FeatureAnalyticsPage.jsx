
import React from 'react';
import { BarChart, TrendingUp, PieChart, Activity } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureAnalyticsPage = () => {
  return (
    <FeaturePageLayout
      title="Analytics"
      subtitle="Deep Performance Insights"
      description="Make data-driven decisions with comprehensive analytics. Track meeting effectiveness, team engagement, and usage trends over time."
      heroImage="https://images.unsplash.com/photo-1516383274235-5f42d6c6426d"
      benefits={[
        { icon: BarChart, title: "Usage Metrics", description: "Track total meeting hours and transcription volume." },
        { icon: TrendingUp, title: "Trend Analysis", description: "Identify patterns in team productivity over time." },
        { icon: PieChart, title: "Engagement Stats", description: "See who is participating and contributing most." }
      ]}
      features={[
        { title: "Custom Reports", description: "Generate PDF reports for management reviews." },
        { title: "Meeting ROI", description: "Estimate cost vs. value of time spent in meetings." },
        { title: "Visual Dashboards", description: "Beautiful, easy-to-read charts and graphs." },
        { title: "Data Export", description: "Export raw data to CSV for external analysis." }
      ]}
      useCases={[
        { title: "Productivity Tracking", description: "Ensure time is being spent on high-value activities." },
        { title: "Resource Planning", description: "Allocate software licenses based on actual usage." },
        { title: "Team Health Check", description: "Identify burnout risks from meeting overload." },
        { title: "Executive Reporting", description: "Demonstrate operational efficiency to leadership." }
      ]}
      prevFeature={{ name: "File Management", link: "/features/file-management" }}
      nextFeature={{ name: "Voice Chat", link: "/features/voice-chat" }}
    />
  );
};

export default FeatureAnalyticsPage;
