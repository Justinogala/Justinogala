import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  Target, TrendingUp, Users, Zap, Mic, BarChart,
  PhoneCall, FileText, Search, MessageSquare, DollarSign, Award
} from 'lucide-react';

const SalesTeams = () => (
  <UseCasePageLayout
    industry="Sales Teams"
    tagline="AI-Powered Sales Intelligence"
    title="Close Deals Faster with AI on Every Call"
    description="Automate CRM entry, capture objection handling patterns, and coach your reps to quota — all powered by real-time meeting intelligence from Munal."
    heroImage="https://images.unsplash.com/photo-1591453214154-c95db71dbd83?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwxfHxzYWxlcyUyMHRlYW0lMjBtZWV0aW5nJTIwYnVzaW5lc3MlMjBkZWFsJTIwaGFuZHNoYWtlfGVufDB8fHx8MTc3NDU2NTgwM3ww&ixlib=rb-4.1.0&q=85"
    accentColor="violet"
    socialProof="Trusted by 200+ sales teams worldwide"
    stats={[
      { value: '2hrs', label: 'Saved per rep per day' },
      { value: '95%', label: 'CRM data accuracy' },
      { value: '50%', label: 'Faster onboarding' },
    ]}
    challenges={[
      { icon: FileText, title: 'Manual CRM Entry', description: 'Reps spend hours each week logging notes, next steps, and deal updates into Salesforce or HubSpot instead of selling.' },
      { icon: Target, title: 'Lost Deal Context', description: 'Critical objections, competitor mentions, and pricing discussions are forgotten within hours of a call.' },
      { icon: Users, title: 'Inconsistent Coaching', description: 'Managers lack visibility into rep conversations, making it hard to identify coaching opportunities at scale.' },
    ]}
    solutions={[
      {
        icon: Mic,
        title: 'Auto-CRM Sync',
        description: 'Munal captures every call, extracts key details, and pushes structured data directly to your CRM — eliminating manual entry entirely.',
        bullets: [
          'Meeting notes, deal highlights, and next steps synced automatically',
          'Custom field mapping to Salesforce, HubSpot, or Pipedrive',
          'Contact and opportunity association with zero rep effort',
        ],
      },
      {
        icon: Search,
        title: 'Deal Intelligence & Forecasting',
        description: 'Analyze sentiment, engagement signals, and conversation patterns to forecast pipeline with confidence.',
        bullets: [
          'AI-scored deal health based on buyer engagement signals',
          'Competitor mention tracking across all rep calls',
          'Trend analysis showing deal momentum over time',
        ],
      },
      {
        icon: Award,
        title: 'Real-Time Coaching & Playbooks',
        description: 'Identify winning patterns, surface coaching moments, and give every rep access to your best practices.',
        bullets: [
          'Talk-to-listen ratio analysis and monologue detection',
          'Battle card suggestions based on competitor mentions',
          'Highlight reels of top-performing call segments',
        ],
      },
    ]}
    workflows={[
      { icon: PhoneCall, title: 'Discovery Calls', description: 'Capture qualification criteria, pain points, and budget signals from initial conversations.' },
      { icon: DollarSign, title: 'Pricing Negotiations', description: 'Track pricing discussions, objections, and concession patterns across your pipeline.' },
      { icon: MessageSquare, title: 'QBRs & Reviews', description: 'Document quarterly business reviews with stakeholders and auto-generate follow-up actions.' },
      { icon: BarChart, title: 'Pipeline Reviews', description: 'Use AI summaries from all rep calls to power data-driven pipeline review meetings.' },
    ]}
    testimonial={{
      quote: "Since deploying Munal, our reps save 2 hours a day on admin work. CRM data quality went from 60% to 95%, and our win rate is up 18%.",
      author: "Jake Morrison",
      role: "VP of Sales, Velocity SaaS"
    }}
    prevCase={{ name: 'Finance', link: '/use-cases/finance' }}
    nextCase={{ name: 'Customer Success', link: '/use-cases/customer-success' }}
  />
);

export default SalesTeams;
