import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  Heart, MessageCircle, RefreshCw, TrendingDown, Users,
  Shield, BarChart, Bell, Search, FileText, Star, Headphones
} from 'lucide-react';

const CustomerSuccess = () => (
  <UseCasePageLayout
    industry="Customer Success"
    tagline="Proactive Customer Intelligence"
    title="Delight Customers at Scale, Prevent Churn Before It Starts"
    description="Track sentiment, capture feature requests, and ensure seamless handoffs — Munal turns every customer interaction into actionable intelligence for your CS team."
    heroImage="https://images.pexels.com/photos/7682464/pexels-photo-7682464.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    accentColor="emerald"
    socialProof="Trusted by 150+ customer success teams globally"
    stats={[
      { value: '3x', label: 'Faster issue resolution' },
      { value: '100%', label: 'Call coverage' },
      { value: '60%', label: 'Less context switching' },
    ]}
    challenges={[
      { icon: TrendingDown, title: 'Invisible Churn Signals', description: 'Subtle changes in customer tone and engagement go undetected until it is too late to intervene.' },
      { icon: MessageCircle, title: 'Scattered Feature Requests', description: 'Customer feedback is trapped in individual CSM notes, never aggregated for Product teams to prioritize.' },
      { icon: RefreshCw, title: 'Broken Handoffs', description: 'Sales-to-CS transitions lose context. New CSMs start from scratch without knowing what was promised.' },
    ]}
    solutions={[
      {
        icon: Heart,
        title: 'Real-Time Sentiment Analysis',
        description: 'Munal tracks customer happiness across every touchpoint, flagging at-risk accounts before renewal conversations.',
        bullets: [
          'Automated sentiment scoring per account over time',
          'Churn risk alerts triggered by negative trend patterns',
          'Executive health dashboards by account tier',
        ],
      },
      {
        icon: Search,
        title: 'Voice of Customer Aggregation',
        description: 'Automatically collect, categorize, and prioritize feature requests and pain points from all customer conversations.',
        bullets: [
          'AI-tagged feature requests across hundreds of calls',
          'Shareable insight reports for Product and Engineering',
          'Trend tracking: "Top 10 customer requests this quarter"',
        ],
      },
      {
        icon: FileText,
        title: 'Seamless Handoff Intelligence',
        description: 'Every deal promise, technical requirement, and expectation is captured and transferred automatically during handoffs.',
        bullets: [
          'Full conversation history linked to each account',
          'Auto-generated handoff briefs from pre-sales meetings',
          'Searchable archive of all customer commitments',
        ],
      },
    ]}
    workflows={[
      { icon: Headphones, title: 'Onboarding Calls', description: 'Document kickoff meetings with implementation plans and success criteria.' },
      { icon: Star, title: 'QBRs', description: 'Auto-generate QBR decks from meeting notes with ROI metrics and usage insights.' },
      { icon: Bell, title: 'Renewal Prep', description: 'Review all account touchpoints before renewal with AI-summarized highlights.' },
      { icon: BarChart, title: 'Executive Reviews', description: 'Aggregate cross-account trends for leadership with data-driven insights.' },
    ]}
    testimonial={{
      quote: "We used to lose context between sales and CS handoffs constantly. With Munal, every CSM starts day one with full account history. Our NPS jumped 22 points.",
      author: "Priya Sharma",
      role: "Director of Customer Success, CloudOps Inc."
    }}
    prevCase={{ name: 'Sales Teams', link: '/use-cases/sales' }}
    nextCase={{ name: 'Product Teams', link: '/use-cases/product' }}
  />
);

export default CustomerSuccess;
