import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  Scale, FileText, Shield, Clock, Gavel, Users,
  Search, PenLine, Lock, Eye, BookOpen, Briefcase
} from 'lucide-react';

const Legal = () => (
  <UseCasePageLayout
    industry="Legal & Compliance"
    tagline="Precision Documentation for Legal Teams"
    title="Every Word Matters. Capture Them All."
    description="Munal gives legal teams the power to transcribe depositions, capture case strategy sessions, and maintain iron-clad compliance records — with AI precision."
    heroImage="https://images.pexels.com/photos/6077961/pexels-photo-6077961.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    accentColor="amber"
    stats={[
      { value: '80%', label: 'Faster deposition review' },
      { value: '99.5%', label: 'Transcript accuracy' },
      { value: '40%', label: 'Reduction in billable admin' },
      { value: '100%', label: 'Chain of custody maintained' },
    ]}
    challenges={[
      { icon: FileText, title: 'Volume of Documentation', description: 'Legal proceedings generate massive volumes of text. Manual transcription is slow, expensive, and error-prone.' },
      { icon: Shield, title: 'Privilege & Confidentiality', description: 'Attorney-client privilege and work product doctrine require strict access controls on sensitive materials.' },
      { icon: Clock, title: 'Deadline Pressure', description: 'Discovery timelines, filing deadlines, and court schedules demand rapid turnaround on meeting documentation.' },
    ]}
    solutions={[
      {
        icon: Search,
        title: 'Intelligent Case Research',
        description: 'Search across all case-related meetings instantly. Find the exact discussion where a key decision was made.',
        bullets: [
          'Full-text search across all transcripts and summaries',
          'Filter by date, participants, case, or keywords',
          'AI-highlighted key legal arguments and precedent references',
        ],
      },
      {
        icon: Lock,
        title: 'Privilege-Aware Access Controls',
        description: 'Granular RBAC ensures only authorized personnel access privileged communications.',
        bullets: [
          'Organization and case-level access permissions',
          'Complete audit trail for every access and edit',
          'Secure sharing for co-counsel and expert witnesses',
        ],
      },
      {
        icon: PenLine,
        title: 'Automated Legal Documentation',
        description: 'Transform meetings into structured legal documents — from deposition summaries to client memos.',
        bullets: [
          'AI-generated meeting summaries with legal formatting',
          'Automatic extraction of action items and deadlines',
          'eSignature integration for approvals and sign-offs',
        ],
      },
    ]}
    workflows={[
      { icon: Gavel, title: 'Depositions', description: 'Real-time transcription of depositions with speaker identification and timestamping.' },
      { icon: Briefcase, title: 'Case Strategy', description: 'Capture internal strategy sessions with privilege markers and restricted access.' },
      { icon: Users, title: 'Client Meetings', description: 'Document client consultations with auto-generated follow-up summaries.' },
      { icon: BookOpen, title: 'Compliance Reviews', description: 'Track regulatory discussions, policy decisions, and compliance audit outcomes.' },
    ]}
    testimonial={{
      quote: "Munal has transformed how our litigation team prepares for trial. We can search months of meeting transcripts in seconds instead of hours.",
      author: "David Park, Esq.",
      role: "Partner, Morrison & Associates LLP"
    }}
    prevCase={{ name: 'Government', link: '/use-cases/government' }}
    nextCase={{ name: 'Finance', link: '/use-cases/finance' }}
  />
);

export default Legal;
