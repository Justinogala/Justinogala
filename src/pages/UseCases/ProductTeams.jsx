import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  Lightbulb, Search, LayoutGrid, Users, MessageSquare,
  GitBranch, BarChart, ClipboardList, Mic, FileText, Layers, Target
} from 'lucide-react';

const ProductTeams = () => (
  <UseCasePageLayout
    industry="Product Teams"
    tagline="Data-Driven Product Decisions"
    title="Build What Matters. Validate with Real Conversations."
    description="Connect directly to the voice of your customer. Search thousands of conversations to validate features, prioritize roadmaps, and ship products users actually want."
    heroImage="https://images.pexels.com/photos/7181112/pexels-photo-7181112.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    accentColor="blue"
    stats={[
      { value: '5x', label: 'Faster feature validation' },
      { value: '80%', label: 'Less guesswork in roadmaps' },
      { value: '1000+', label: 'Conversations searchable' },
      { value: '30%', label: 'Higher feature adoption' },
    ]}
    challenges={[
      { icon: Search, title: 'Disconnected from Users', description: 'Product managers rely on secondhand summaries. The real voice of the customer gets lost between sales, support, and CS.' },
      { icon: LayoutGrid, title: 'Roadmap Prioritization', description: 'Without data on frequency and impact, feature prioritization becomes opinion-driven instead of evidence-based.' },
      { icon: Users, title: 'Cross-Team Alignment', description: 'Engineering, Design, and PM interpret requirements differently when meeting notes are vague or incomplete.' },
    ]}
    solutions={[
      {
        icon: Mic,
        title: 'Universal Conversation Search',
        description: 'Search across thousands of sales calls, CS meetings, and user interviews to find every mention of a feature or pain point.',
        bullets: [
          'Full-text search across all team conversations',
          'Filter by customer segment, date, or sentiment',
          'Clip and share exact moments with your engineering squad',
        ],
      },
      {
        icon: Lightbulb,
        title: 'Evidence-Based Feature Validation',
        description: 'Stop guessing what users want. Ground every roadmap decision in real customer conversations and quantified demand.',
        bullets: [
          'AI-tagged feature requests aggregated by frequency',
          'Customer quotes linked directly to feature proposals',
          'Impact scoring based on account value and request volume',
        ],
      },
      {
        icon: FileText,
        title: 'Auto-Generated Specs & PRDs',
        description: 'Turn brainstorming sessions and user research calls into drafted product specs and requirements documents.',
        bullets: [
          'Meeting-to-PRD transformation with AI',
          'Action items auto-extracted and assigned to owners',
          'Version history of how requirements evolved',
        ],
      },
    ]}
    workflows={[
      { icon: Target, title: 'User Interviews', description: 'Capture rich qualitative data from user research sessions with auto-tagged themes.' },
      { icon: ClipboardList, title: 'Sprint Planning', description: 'Document sprint planning outcomes with clear acceptance criteria from discussions.' },
      { icon: GitBranch, title: 'Design Reviews', description: 'Record design critiques and decisions for future reference and onboarding.' },
      { icon: Layers, title: 'Roadmap Reviews', description: 'Data-driven roadmap sessions powered by aggregated customer voice data.' },
    ]}
    testimonial={{
      quote: "We used to spend weeks surveying customers to validate features. Now we search Munal and have the answer in minutes, backed by real conversation data.",
      author: "Lena Torres",
      role: "Head of Product, Kiteflow"
    }}
    prevCase={{ name: 'Customer Success', link: '/use-cases/customer-success' }}
    nextCase={{ name: 'Engineering', link: '/use-cases/engineering' }}
  />
);

export default ProductTeams;
