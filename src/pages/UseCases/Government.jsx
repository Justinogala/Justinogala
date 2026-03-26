import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  Landmark, Shield, FileText, Users, Lock, Eye,
  ClipboardList, Scale, Globe, Building, Mic, Archive
} from 'lucide-react';

const Government = () => (
  <UseCasePageLayout
    industry="Government"
    tagline="Secure. Compliant. Transparent."
    title="AI-Powered Meeting Intelligence for Public Service"
    description="Munal helps government agencies digitize meetings, ensure compliance with open-records laws, and make public proceedings more accessible to citizens."
    heroImage="https://images.unsplash.com/photo-1768353086314-9ddfb405a057?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxnb3Zlcm5tZW50JTIwcGFybGlhbWVudCUyMGJ1aWxkaW5nJTIwbW9kZXJufGVufDB8fHx8MTc3NDU2NDg3MXww&ixlib=rb-4.1.0&q=85"
    accentColor="slate"
    stats={[
      { value: '70%', label: 'Faster minutes publication' },
      { value: '100%', label: 'Audit trail compliance' },
      { value: '5x', label: 'Faster FOIA response' },
      { value: '50+', label: 'Agencies onboarded' },
    ]}
    challenges={[
      { icon: FileText, title: 'Open Records Requirements', description: 'FOIA, sunshine laws, and public records mandates require thorough documentation of every official meeting.' },
      { icon: Shield, title: 'Security & Sovereignty', description: 'Government data must be handled with the highest security standards and strict access controls.' },
      { icon: Users, title: 'Cross-Agency Coordination', description: 'Inter-departmental task forces and multi-agency initiatives need centralized, searchable records.' },
    ]}
    solutions={[
      {
        icon: Mic,
        title: 'Automated Meeting Minutes',
        description: 'Transform council meetings, hearings, and committee sessions into structured, publishable minutes automatically.',
        bullets: [
          'Speaker-attributed transcription for public hearings',
          'Auto-generated motions, votes, and decision summaries',
          'Publish-ready format for public records portals',
        ],
      },
      {
        icon: Lock,
        title: 'Government-Grade Security',
        description: 'Role-based access control ensures classified briefings stay classified while public meetings remain transparent.',
        bullets: [
          'Organization-scoped RBAC with full audit logging',
          'Encrypted data at rest and in transit',
          'Granular permission controls per department',
        ],
      },
      {
        icon: Globe,
        title: 'Citizen Transparency',
        description: 'Make government more accessible with searchable archives and AI-summarized proceedings.',
        bullets: [
          'Public-facing searchable meeting archives',
          'AI summaries of lengthy proceedings for citizen review',
          'Automated captioning for accessibility compliance',
        ],
      },
    ]}
    workflows={[
      { icon: Landmark, title: 'Council Meetings', description: 'Transcribe and publish city council, county, and legislative sessions with full speaker attribution.' },
      { icon: Scale, title: 'Public Hearings', description: 'Document citizen testimony, expert panels, and regulatory hearings accurately.' },
      { icon: Building, title: 'Agency Briefings', description: 'Secure documentation of internal briefings with classified access controls.' },
      { icon: Archive, title: 'Records Management', description: 'Searchable archive of all meetings for FOIA compliance and institutional memory.' },
    ]}
    testimonial={{
      quote: "We reduced our meeting minutes publication time from two weeks to two days. Citizens now have faster access to their government's decisions.",
      author: "Maria Gonzalez",
      role: "City Clerk, City of Riverside"
    }}
    prevCase={{ name: 'Education', link: '/use-cases/education' }}
    nextCase={{ name: 'Legal & Compliance', link: '/use-cases/legal' }}
  />
);

export default Government;
