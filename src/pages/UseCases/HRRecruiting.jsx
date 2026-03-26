import React from 'react';
import UseCasePageLayout from '@/components/features/UseCasePageLayout';
import {
  UserCheck, FileText, Briefcase, Users, Mic, Shield,
  Search, Star, ClipboardList, Heart, BarChart, Award
} from 'lucide-react';

const HRRecruiting = () => (
  <UseCasePageLayout
    industry="HR & Recruiting"
    tagline="Interview Intelligence Platform"
    title="Focus on the Candidate, Not the Notes"
    description="Munal captures every interview, generates structured scorecards, and ensures fair, consistent hiring — so your team can focus on finding the right talent."
    heroImage="https://images.unsplash.com/photo-1758518730162-09a142505bfd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwxfHxociUyMHJlY3J1aXRpbmclMjBpbnRlcnZpZXclMjBoaXJpbmclMjBvZmZpY2V8ZW58MHx8fHwxNzc0NTY1ODA3fDA&ixlib=rb-4.1.0&q=85"
    accentColor="amber"
    socialProof="Trusted by 80+ talent acquisition teams"
    stats={[
      { value: '3x', label: 'More structured feedback' },
      { value: '85%', label: 'Interview completion rate' },
      { value: '40%', label: 'Less interviewer bias' },
    ]}
    challenges={[
      { icon: FileText, title: 'Note-Taking Distraction', description: 'Interviewers split attention between engaging the candidate and capturing feedback, resulting in shallow assessments.' },
      { icon: Shield, title: 'Inconsistent Evaluations', description: 'Without structured criteria, interview feedback varies wildly between interviewers, making fair comparison impossible.' },
      { icon: Users, title: 'Slow Debrief Cycles', description: 'Hiring panels wait days for scattered feedback. Top candidates accept other offers while your team deliberates.' },
    ]}
    solutions={[
      {
        icon: Mic,
        title: 'Full Interview Transcription',
        description: 'Every candidate conversation is transcribed with speaker attribution, so interviewers can be fully present.',
        bullets: [
          'Real-time transcription during phone, video, and panel interviews',
          'Speaker-labeled output for multi-interviewer panels',
          'Searchable transcript archive by role, stage, or candidate',
        ],
      },
      {
        icon: ClipboardList,
        title: 'AI-Assisted Scorecards',
        description: 'Munal suggests scorecard ratings based on candidate responses, mapped to your competency framework.',
        bullets: [
          'Auto-populated scorecards aligned to role requirements',
          'Evidence-linked ratings tied to exact transcript moments',
          'Standardized evaluation across all interviewers',
        ],
      },
      {
        icon: UserCheck,
        title: 'Bias Detection & Fair Hiring',
        description: 'Analyze interview questions and evaluations for potential bias patterns to build a more equitable hiring process.',
        bullets: [
          'Question consistency analysis across candidate demographics',
          'Talk-time balance monitoring between interviewer and candidate',
          'Compliance-ready documentation for audit requirements',
        ],
      },
    ]}
    workflows={[
      { icon: Star, title: 'Candidate Screening', description: 'Capture initial phone screens with structured notes and automatic next-step recommendations.' },
      { icon: Briefcase, title: 'Panel Interviews', description: 'Multi-interviewer sessions captured with individual feedback and consolidated scoring.' },
      { icon: Heart, title: 'Culture Fit Assessments', description: 'Document values-based interviews with AI insights on alignment indicators.' },
      { icon: Award, title: 'Hiring Debriefs', description: 'Accelerate debrief meetings with pre-generated candidate summaries and comparative scorecards.' },
    ]}
    testimonial={{
      quote: "Munal transformed our hiring process. Interviewers are more present, feedback is structured, and we reduced our time-to-hire by 35%. It's a game-changer for talent teams.",
      author: "Rachel Kim",
      role: "Head of Talent Acquisition, NovaTech"
    }}
    prevCase={{ name: 'Engineering', link: '/use-cases/engineering' }}
    nextCase={{ name: 'Healthcare', link: '/use-cases/healthcare' }}
  />
);

export default HRRecruiting;
