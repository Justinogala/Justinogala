import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  Wallet, TrendingUp, Shield, BarChart, Lock, FileText,
  Users, Clock, PieChart, Building, CreditCard, AlertTriangle
} from 'lucide-react';

const Finance = () => (
  <UseCasePageLayout
    industry="Finance"
    tagline="Compliant Intelligence for Finance"
    title="Accelerate Decisions. Automate Compliance."
    description="Munal helps financial teams capture investment discussions, document regulatory meetings, and maintain the audit trails required by regulators — all powered by AI."
    heroImage="https://images.unsplash.com/photo-1758519292135-2af0ad50f552?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwyfHxmaW5hbmNlJTIwYmFua2luZyUyMHRlY2hub2xvZ3klMjBtb2Rlcm58ZW58MHx8fHwxNzc0NTY0ODcyfDA&ixlib=rb-4.1.0&q=85"
    accentColor="violet"
    stats={[
      { value: '55%', label: 'Faster compliance reporting' },
      { value: '3x', label: 'More meetings documented' },
      { value: '100%', label: 'Regulatory audit readiness' },
      { value: '$2M+', label: 'Annual cost savings avg.' },
    ]}
    challenges={[
      { icon: Shield, title: 'Regulatory Compliance', description: 'SEC, MiFID II, Dodd-Frank, and other regulations require meticulous documentation of investment discussions and decisions.' },
      { icon: Clock, title: 'Speed of Decision-Making', description: 'Markets move fast. Investment committees need rapid access to meeting outcomes and prior discussion context.' },
      { icon: AlertTriangle, title: 'Risk Documentation', description: 'Risk committee discussions, audit findings, and incident reviews must be captured with absolute accuracy.' },
    ]}
    solutions={[
      {
        icon: FileText,
        title: 'Automated Compliance Records',
        description: 'Every investment committee, board meeting, and client advisory session is transcribed and archived for regulatory review.',
        bullets: [
          'Timestamped, speaker-attributed transcripts',
          'Auto-flagging of compliance-sensitive keywords',
          'Export-ready reports for regulatory submissions',
        ],
      },
      {
        icon: BarChart,
        title: 'Investment Decision Intelligence',
        description: 'Search across months of investment committee discussions to trace the rationale behind any portfolio decision.',
        bullets: [
          'Full-text search with date and topic filters',
          'AI-generated decision summaries with voting records',
          'Linked action items with accountability tracking',
        ],
      },
      {
        icon: Lock,
        title: 'Enterprise-Grade Security',
        description: 'Multi-layered access controls designed for the sensitive nature of financial data.',
        bullets: [
          'Chinese wall enforcement with team-level access',
          'Complete audit logs for every document access',
          'Encrypted storage meeting financial data standards',
        ],
      },
    ]}
    workflows={[
      { icon: PieChart, title: 'Investment Committees', description: 'Transcribe and summarize IC meetings with decision tracking and vote recording.' },
      { icon: Building, title: 'Board Meetings', description: 'Automated board minutes with resolution tracking and regulatory-ready formatting.' },
      { icon: Users, title: 'Client Advisory', description: 'Document wealth management and advisory sessions with suitability records.' },
      { icon: CreditCard, title: 'Risk & Audit', description: 'Capture risk committee discussions and internal audit reviews with full traceability.' },
    ]}
    testimonial={{
      quote: "Our compliance team used to spend weeks compiling meeting records for regulatory reviews. With Munal, we're always audit-ready.",
      author: "Amanda Torres",
      role: "Head of Compliance, Atlas Capital Partners"
    }}
    prevCase={{ name: 'Legal & Compliance', link: '/use-cases/legal' }}
    nextCase={{ name: 'Sales Teams', link: '/use-cases/sales' }}
  />
);

export default Finance;
