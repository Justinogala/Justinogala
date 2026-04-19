import React from 'react';
import { Shield, Clock, FileSignature, FolderOpen, Video, Brain } from 'lucide-react';
import SolutionPage from './SolutionPage';

const HealthcareSolutionPage = () => (
  <SolutionPage
    industry="Healthcare"
    headline="AI-Powered Workforce Management for Healthcare"
    subtitle="Streamline clinical and administrative operations with HIPAA-aligned meeting summaries, smart shift scheduling for medical staff, digital eSignatures for patient intake, and centralized document management — all secured with AES-256 encryption."
    description="Munal AI helps hospitals, clinics, and healthcare organizations reduce administrative burden, improve leadership alignment, and ensure compliance with intelligent automation."
    metaTitle="Munal AI for Healthcare — AI Meeting Summaries, Shift Management, eSignatures & DocHub"
    metaDescription="Munal AI for healthcare: AI meeting summaries for clinical leadership alignment, smart shift management for medical staff rotations, eSignatures for patient intake, DocHub for medical records, and enterprise AES-256 security."
    ctaText="Start Free for Healthcare"
    features={[
      { icon: Brain, title: "AI Meeting Summaries for Clinical Leadership", description: "Automatically transcribe and summarize clinical and administrative meetings with GPT-5.2. Extract action items, decisions, and follow-ups to keep leadership aligned across departments." },
      { icon: Clock, title: "Smart Shift Management for Medical Staff", description: "Schedule nurses, doctors, and support staff across 24/7 rotations with drag-and-drop planning. Automated reminders, swap requests, and real-time coverage tracking ensure adequate staffing." },
      { icon: FileSignature, title: "eSignatures for Patient Intake & Compliance", description: "Digitize patient intake forms, consent documents, and compliance paperwork with legally binding eSignatures. Multi-step approval workflows route documents through the right hands." },
      { icon: FolderOpen, title: "DocHub for Medical Records & Documentation", description: "Centralize medical records, strategy documents, and compliance files in a secure, searchable repository. PDF editing, file conversion, and version control built in." },
      { icon: Video, title: "Text-to-Video for Staff Training & Announcements", description: "Create quick training videos and health announcements from text prompts using AI. Ideal for onboarding new medical staff or communicating policy changes across departments." },
      { icon: Shield, title: "Enterprise Security with AES-256 Encryption", description: "Protect sensitive patient data with AES-256 encryption, two-factor authentication, role-based access control, and comprehensive audit logging. Designed for HIPAA-aligned environments." }
    ]}
    useCases={[
      { title: "Clinical & Administrative Leadership Alignment", description: "Use AI meeting summaries to ensure clinical directors and administrative leaders stay aligned on decisions, action items, and strategic priorities after every meeting." },
      { title: "Nursing & Medical Staff Shift Rotations", description: "Schedule 24/7 medical staff rotations with smart shift management. Track overtime, manage swap requests, and ensure compliance with labor regulations." },
      { title: "Patient Intake & Consent Forms", description: "Replace paper-based patient intake with digital forms and eSignatures. Multi-step approvals ensure documents are reviewed by the right clinical and administrative staff." },
      { title: "Centralized Medical Record Management", description: "Store, organize, and search medical records and compliance documents in DocHub with enterprise-grade encryption and access controls." },
      { title: "Internal Staff Training & Health Announcements", description: "Generate quick training videos and audio announcements for staff onboarding, policy updates, and health awareness campaigns using AI text-to-video and text-to-audio." }
    ]}
    faqs={[
      { q: "Is Munal AI HIPAA compliant for healthcare use?", a: "Munal AI is designed with HIPAA-aligned security practices including AES-256 encryption for data at rest and in transit, two-factor authentication, role-based access control, and comprehensive audit logging. We recommend consulting with your compliance team for specific HIPAA certification requirements." },
      { q: "Can Munal AI transcribe and summarize clinical meetings?", a: "Yes. Munal AI uses OpenAI Whisper for real-time meeting transcription and GPT-5.2 for automatic summaries. It extracts action items, decisions, and follow-ups — making it ideal for clinical and administrative leadership alignment meetings." },
      { q: "How does smart shift management work for medical staff?", a: "Munal AI provides a visual drag-and-drop shift scheduler with day, week, and month views. You can schedule nurses, doctors, and support staff across 24/7 rotations, set up automated reminders, manage shift swap requests, and track real-time coverage gaps." },
      { q: "Can we use eSignatures for patient intake forms?", a: "Absolutely. Munal AI supports legally binding digital eSignatures with full audit trails. You can create template-based patient intake forms with multi-step approval workflows that route documents through clinical and administrative reviewers." },
      { q: "What is DocHub and how does it help with medical records?", a: "DocHub is Munal AI's centralized document management system. It provides secure storage, PDF editing, file conversion, version control, and granular access permissions — perfect for managing medical records, strategy documents, and compliance files." },
      { q: "Can we create training videos for medical staff using Munal AI?", a: "Yes. Munal AI includes text-to-video (powered by Sora 2) and text-to-audio generation. You can create quick staff training content, health announcements, and patient education materials from simple text prompts." }
    ]}
  />
);

export default HealthcareSolutionPage;
