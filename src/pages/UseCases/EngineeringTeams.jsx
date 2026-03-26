import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  Code, Terminal, GitMerge, FileCode, Mic, Search,
  Bug, Layers, Clock, Cpu, BookOpen, Zap
} from 'lucide-react';

const EngineeringTeams = () => (
  <UseCasePageLayout
    industry="Engineering"
    tagline="Developer-First Meeting Intelligence"
    title="Ship Faster with Crystal-Clear Requirements"
    description="Capture technical decisions, architectural reviews, and sprint discussions automatically. Never lose context on why a decision was made — searchable forever in Munal."
    heroImage="https://images.pexels.com/photos/6804068/pexels-photo-6804068.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    accentColor="violet"
    stats={[
      { value: '45%', label: 'Less meeting overhead' },
      { value: '2x', label: 'Faster requirement clarity' },
      { value: '100%', label: 'Decision traceability' },
      { value: '70%', label: 'Fewer requirement misses' },
    ]}
    challenges={[
      { icon: Clock, title: 'Meeting Overload', description: 'Engineers spend 10+ hours per week in meetings. Capturing action items and decisions while staying engaged is nearly impossible.' },
      { icon: FileCode, title: 'Lost Technical Context', description: 'Architectural decisions discussed in standups and reviews are forgotten. New team members have no idea why things were built a certain way.' },
      { icon: Bug, title: 'Requirement Misalignment', description: 'Vague or incomplete specs from planning meetings lead to rework cycles and missed sprint commitments.' },
    ]}
    solutions={[
      {
        icon: Terminal,
        title: 'Auto-Generated Tech Specs',
        description: 'Munal transforms brainstorming sessions and planning meetings into drafted technical specifications with structured requirements.',
        bullets: [
          'Meeting-to-spec generation with AI understanding of technical context',
          'Automatic extraction of acceptance criteria from discussions',
          'Structured output format compatible with Confluence and Notion',
        ],
      },
      {
        icon: GitMerge,
        title: 'Standup & Retro Intelligence',
        description: 'Extract blockers, updates, and action items from daily standups and retrospectives automatically — synced to your board.',
        bullets: [
          'Auto-extracted blockers pushed to Jira or Linear tickets',
          'Sprint velocity insights from recurring meeting patterns',
          'Retro action items tracked across sprints with accountability',
        ],
      },
      {
        icon: Search,
        title: 'Searchable Decision History',
        description: 'Every architectural decision, trade-off discussion, and technical debate is indexed and searchable forever.',
        bullets: [
          'Full-text search: "Why did we choose PostgreSQL over DynamoDB?"',
          'Speaker-attributed decisions for accountability',
          'Timeline view of how technical decisions evolved',
        ],
      },
    ]}
    workflows={[
      { icon: Cpu, title: 'Architecture Reviews', description: 'Document system design decisions with full context on trade-offs and alternatives considered.' },
      { icon: Layers, title: 'Sprint Planning', description: 'Auto-extract story points, assignments, and acceptance criteria from planning sessions.' },
      { icon: BookOpen, title: 'Incident Post-Mortems', description: 'Capture root cause analysis discussions with structured timelines and action items.' },
      { icon: Zap, title: 'Tech Debt Reviews', description: 'Track tech debt discussions and prioritization decisions across quarters.' },
    ]}
    testimonial={{
      quote: "Our engineers used to dread meetings. Now they know every decision is captured. We can search 'why we migrated to Kubernetes' and get the exact conversation from 6 months ago.",
      author: "Marcus Chen",
      role: "Engineering Manager, DataPipe Systems"
    }}
    prevCase={{ name: 'Product Teams', link: '/use-cases/product' }}
    nextCase={{ name: 'HR & Recruiting', link: '/use-cases/hr' }}
  />
);

export default EngineeringTeams;
