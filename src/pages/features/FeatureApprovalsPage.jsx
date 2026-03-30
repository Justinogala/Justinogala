import React from 'react';
import { CheckCircle, GitBranch, Clock, BarChart } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureApprovalsPage = () => {
  return (
    <FeaturePageLayout
      title="Approvals"
      subtitle="Streamlined Workflow Approvals"
      description="Automate your approval workflows with multi-step chains, delegation support, AI-powered insights, and full audit trails. Never lose track of pending requests again."
      heroImage={`${API_URL}/api/static/feature_approvals.png`}
      benefits={[
        { icon: CheckCircle, title: "Multi-Step Workflows", description: "Create sequential or parallel approval chains with custom conditions." },
        { icon: GitBranch, title: "Smart Delegation", description: "Delegate approvals to substitutes when you're unavailable with full audit trails." },
        { icon: BarChart, title: "AI Analytics", description: "GPT-powered insights identify bottlenecks and optimize your approval processes." }
      ]}
      features={[
        { title: "Template Builder", description: "Create reusable approval templates for common requests like PTO, expenses, and procurement." },
        { title: "Priority Levels", description: "Flag urgent requests and set SLA timers to ensure timely responses." },
        { title: "Delegation System", description: "Assign substitutes who can approve on your behalf with reason tracking." },
        { title: "Analytics Dashboard", description: "Track approval rates, response times, bottlenecks, and category trends." }
      ]}
      useCases={[
        { title: "Expense Reports", description: "Route expense claims through managers and finance with auto-escalation." },
        { title: "Time-Off Requests", description: "Streamline PTO approvals with calendar awareness and team coverage checks." },
        { title: "Document Sign-offs", description: "Get multi-department approvals on contracts, policies, and procedures." },
        { title: "Purchase Orders", description: "Enforce spending limits with tiered approval chains based on amount." }
      ]}
      prevFeature={{ name: "Video Calls", link: "/features/video-calls" }}
      nextFeature={{ name: "eSignature", link: "/features/esignature" }}
    />
  );
};

export default FeatureApprovalsPage;
