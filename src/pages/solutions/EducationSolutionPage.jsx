import React from 'react';
import { Shield, Clock, FileSignature, FolderOpen, Video, Brain } from 'lucide-react';
import SolutionPage from './SolutionPage';

const EducationSolutionPage = () => (
  <SolutionPage
    industry="Education"
    headline="AI-Powered Collaboration for Education"
    subtitle="Transform how schools, colleges, and universities operate with AI meeting transcription for faculty meetings, smart scheduling for academic staff, digital forms for enrollment, and secure document management for student records."
    description="Munal AI helps educational institutions reduce administrative overhead, improve faculty collaboration, and streamline student services with intelligent automation."
    metaTitle="Munal AI for Education — AI Meeting Notes, Staff Scheduling, Digital Forms & Secure DocHub"
    metaDescription="Munal AI for education: AI meeting transcription for faculty, smart scheduling for academic staff, digital enrollment forms, secure document management for student records, and AI training content creation."
    ctaText="Start Free for Education"
    features={[
      { icon: Brain, title: "AI Meeting Transcription for Faculty", description: "Automatically transcribe and summarize faculty meetings, department heads sessions, and board meetings. AI extracts key decisions, action items, and deadlines for institutional alignment." },
      { icon: Clock, title: "Smart Scheduling for Academic Staff", description: "Manage teaching schedules, exam invigilation rosters, and administrative shifts with visual drag-and-drop scheduling. Automated reminders keep staff informed." },
      { icon: FileSignature, title: "Digital Forms for Enrollment & Admissions", description: "Replace paper-based enrollment with digital forms and eSignatures. Multi-step approval workflows route applications through admissions, finance, and department heads." },
      { icon: FolderOpen, title: "Secure Document Management for Student Records", description: "Centralize student records, academic transcripts, and institutional documents in DocHub with encryption, version control, and access permissions." },
      { icon: Video, title: "AI Training Content for Staff Development", description: "Create professional development videos and instructional content from text prompts. Ideal for onboarding new faculty, training TAs, and creating orientation materials." },
      { icon: Shield, title: "Enterprise-Grade Security for Student Data", description: "Protect sensitive student data with AES-256 encryption, two-factor authentication, role-based access control, and comprehensive audit trails." }
    ]}
    useCases={[
      { title: "Faculty Meeting Documentation", description: "Automatically transcribe and summarize faculty meetings with AI. Distribute action items and decisions to department heads without manual note-taking." },
      { title: "Exam & Class Scheduling", description: "Use smart shift scheduling to manage exam invigilation, lab sessions, and tutorial hours across multiple departments and campuses." },
      { title: "Student Enrollment & Admissions", description: "Digitize enrollment forms with eSignatures and route applications through multi-step approval workflows for admissions, financial aid, and department review." },
      { title: "Academic Record Management", description: "Store transcripts, certificates, and institutional documents securely in DocHub with encryption and access controls meeting educational data protection standards." },
      { title: "Staff Onboarding & Professional Development", description: "Generate training videos and orientation materials with AI text-to-video. Create audio guides for new faculty and teaching assistants." }
    ]}
    faqs={[
      { q: "Can Munal AI transcribe faculty and board meetings?", a: "Yes. Munal AI uses OpenAI Whisper for real-time transcription and GPT-5.2 for automatic summaries with action items, decisions, and follow-ups — ideal for faculty senate, department, and board meetings." },
      { q: "How does scheduling work for educational institutions?", a: "Munal AI provides visual drag-and-drop scheduling with day, week, and month views. You can manage teaching schedules, exam invigilation, lab sessions, and administrative shifts with automated reminders and swap requests." },
      { q: "Is student data secure on Munal AI?", a: "Absolutely. Munal AI uses AES-256 encryption, two-factor authentication, role-based access control, and audit logging to protect sensitive student data in compliance with educational data protection requirements." },
      { q: "Can we use digital forms for student enrollment?", a: "Yes. Munal AI supports digital forms with legally binding eSignatures and multi-step approval workflows. You can create enrollment, registration, and consent forms that route through admissions, finance, and academic departments." },
      { q: "How can we create training content for staff?", a: "Use Munal AI's text-to-video (Sora 2) and text-to-audio features to create professional development content, orientation videos, and instructional materials from simple text prompts." }
    ]}
  />
);

export default EducationSolutionPage;
