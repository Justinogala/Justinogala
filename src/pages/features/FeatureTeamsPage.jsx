
import React from 'react';
import { Users, Lock, Settings, Layout } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureTeamsPage = () => {
  return (
    <FeaturePageLayout
      title="Teams"
      subtitle="Robust Team Management"
      description="Scale your collaboration with powerful team structures. Manage workspaces, roles, and permissions to keep everyone organized and secure."
      heroImage={`${API_URL}/api/static/feature_workspaces.png`}
      benefits={[
        { icon: Layout, title: "Organized Workspaces", description: "Separate environments for different departments or clients." },
        { icon: Users, title: "Role Management", description: "Assign Admin, Member, or Viewer roles easily." },
        { icon: Lock, title: "Enterprise Security", description: "Control exactly who accesses what data." }
      ]}
      features={[
        { title: "Team Analytics", description: "View usage and productivity stats for the whole group." },
        { title: "Easy Onboarding", description: "Invite members via email or bulk import." },
        { title: "Channel Permissions", description: "Create private channels for sensitive discussions." },
        { title: "Centralized Billing", description: "Manage subscriptions for all team members in one place." }
      ]}
      useCases={[
        { title: "Department Organization", description: "Give Sales, Marketing, and Eng their own spaces." },
        { title: "Project Teams", description: "Spin up temporary workspaces for specific initiatives." },
        { title: "Client Collaboration", description: "Invite guests to specific channels securely." },
        { title: "Scaling Startups", description: "Add new hires seamlessly as you grow." }
      ]}
      prevFeature={{ name: "Chat & Messaging", link: "/features/chat-messaging" }}
      nextFeature={{ name: "File Management", link: "/features/file-management" }}
    />
  );
};

export default FeatureTeamsPage;
