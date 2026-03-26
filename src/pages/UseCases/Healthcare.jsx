import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  HeartPulse, FileText, Shield, Clock, Users, Stethoscope,
  ClipboardList, Activity, Lock, Video, Mic, Calendar
} from 'lucide-react';

const Healthcare = () => (
  <UseCasePageLayout
    industry="Healthcare"
    tagline="HIPAA-Ready AI Companion"
    title="Smarter Clinical Documentation, Better Patient Care"
    description="Munal empowers healthcare teams to capture clinical discussions, automate documentation, and maintain compliance — so providers can focus on what matters most: the patient."
    heroImage="https://images.unsplash.com/photo-1758691461957-13aff0c37c6f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwdGVjaG5vbG9neSUyMGRpZ2l0YWwlMjBob3NwaXRhbHxlbnwwfHx8fDE3NzQ1NjQ4Njl8MA&ixlib=rb-4.1.0&q=85"
    accentColor="emerald"
    stats={[
      { value: '60%', label: 'Less time on documentation' },
      { value: '99.2%', label: 'Transcription accuracy' },
      { value: '3x', label: 'Faster report turnaround' },
      { value: '100%', label: 'Audit trail coverage' },
    ]}
    challenges={[
      { icon: Clock, title: 'Documentation Overload', description: 'Clinicians spend up to 2 hours per day on notes, reducing time with patients and increasing burnout risk.' },
      { icon: Shield, title: 'Compliance Pressure', description: 'HIPAA, HITECH, and institutional review requirements demand meticulous record-keeping and access controls.' },
      { icon: Users, title: 'Care Team Coordination', description: 'Multidisciplinary rounds, handoffs, and referrals require seamless information sharing across departments.' },
    ]}
    solutions={[
      {
        icon: Mic,
        title: 'AI-Powered Clinical Transcription',
        description: 'Automatically transcribe patient consultations, rounds, and handoff meetings with medical-grade accuracy.',
        bullets: [
          'Real-time speech-to-text during clinical encounters',
          'Medical terminology recognition and proper formatting',
          'Structured SOAP note generation from unstructured conversation',
        ],
      },
      {
        icon: Lock,
        title: 'Compliance-First Architecture',
        description: 'Built with healthcare regulations in mind from day one. Role-based access, encryption, and full audit trails.',
        bullets: [
          'Organization-scoped access controls (RBAC)',
          'Complete permission audit logging',
          'Encrypted storage and secure data handling',
        ],
      },
      {
        icon: Video,
        title: 'Telehealth Meeting Intelligence',
        description: 'Record and summarize telehealth sessions, capturing key clinical decisions and follow-up actions.',
        bullets: [
          'Automatic meeting summaries with action items',
          'Timestamped key moments for easy review',
          'Secure sharing with referring providers',
        ],
      },
    ]}
    workflows={[
      { icon: Stethoscope, title: 'Patient Consultations', description: 'Capture every detail from intake interviews and follow-ups without manual note-taking.' },
      { icon: ClipboardList, title: 'Clinical Rounds', description: 'Document multidisciplinary team discussions with speaker attribution and action items.' },
      { icon: Activity, title: 'Shift Handoffs', description: 'Structured handoff reports generated from verbal briefings between shifts.' },
      { icon: Calendar, title: 'Care Coordination', description: 'Schedule, document, and track follow-ups across departments and specialties.' },
    ]}
    testimonial={{
      quote: "Munal cut our post-consultation documentation time by over half. Our physicians can finally focus on patients instead of paperwork.",
      author: "Dr. Sarah Chen",
      role: "Chief Medical Officer, Regional Health Network"
    }}
    prevCase={{ name: 'HR & Recruiting', link: '/use-cases/hr' }}
    nextCase={{ name: 'Education', link: '/use-cases/education' }}
  />
);

export default Healthcare;
