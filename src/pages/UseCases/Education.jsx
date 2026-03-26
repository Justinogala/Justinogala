import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  BookOpen, GraduationCap, FileText, Users, Mic, Video,
  PenLine, ClipboardList, Calendar, Globe, Brain, Library
} from 'lucide-react';

const Education = () => (
  <UseCasePageLayout
    industry="Education"
    tagline="AI for Classrooms & Campuses"
    title="Transform Learning with Intelligent Note-Taking"
    description="From lecture capture to faculty meetings, Munal helps educators and institutions save time, improve accessibility, and keep every learner engaged."
    heroImage="https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    accentColor="blue"
    socialProof="Trusted by 75+ educational institutions worldwide"
    stats={[
      { value: '10K+', label: 'Hours transcribed monthly' },
      { value: '98%', label: 'Student satisfaction rate' },
      { value: '24/7', label: 'On-demand study materials' },
    ]}
    challenges={[
      { icon: BookOpen, title: 'Lecture Accessibility', description: 'Students with disabilities or language barriers struggle to keep up without real-time captions or transcripts.' },
      { icon: Users, title: 'Faculty Collaboration', description: 'Department meetings, curriculum reviews, and research discussions need structured documentation.' },
      { icon: FileText, title: 'Administrative Overhead', description: 'Accreditation, board meetings, and compliance reporting consume administrative resources.' },
    ]}
    solutions={[
      {
        icon: Mic,
        title: 'Automatic Lecture Transcription',
        description: 'Every lecture is captured, transcribed, and indexed for search — giving students a permanent study resource.',
        bullets: [
          'Real-time captions during live lectures',
          'Searchable transcript archives by course and date',
          'Auto-generated study guides and key concept summaries',
        ],
      },
      {
        icon: Video,
        title: 'Smart Meeting Documentation',
        description: 'Faculty senate, department meetings, and advisory boards — all documented with AI summaries and action tracking.',
        bullets: [
          'Meeting minutes generated automatically',
          'Action items assigned and tracked',
          'Searchable archive for accreditation evidence',
        ],
      },
      {
        icon: Globe,
        title: 'Inclusive & Accessible Learning',
        description: 'Munal makes education accessible to every student regardless of ability, language, or learning style.',
        bullets: [
          'Multi-language transcript support',
          'ADA-compliant captioning for recorded content',
          'Audio-to-text for recorded office hours and tutorials',
        ],
      },
    ]}
    workflows={[
      { icon: GraduationCap, title: 'Lecture Capture', description: 'Automatically transcribe and summarize lectures into searchable study materials.' },
      { icon: ClipboardList, title: 'Faculty Meetings', description: 'Document curriculum decisions, committee outcomes, and policy changes.' },
      { icon: Brain, title: 'Research Discussions', description: 'Capture thesis defenses, lab meetings, and research group brainstorms.' },
      { icon: Calendar, title: 'Academic Planning', description: 'Track semester planning meetings, accreditation prep, and board reviews.' },
    ]}
    testimonial={{
      quote: "Our students love having searchable lecture transcripts. Munal has made our courses significantly more accessible and our faculty meetings far more productive.",
      author: "Prof. James Okafor",
      role: "Dean of Academic Affairs, Metropolitan University"
    }}
    prevCase={{ name: 'Healthcare', link: '/use-cases/healthcare' }}
    nextCase={{ name: 'Government', link: '/use-cases/government' }}
  />
);

export default Education;
