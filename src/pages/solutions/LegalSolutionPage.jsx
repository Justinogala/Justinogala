import React from 'react';
import { Shield, Clock, FileSignature, FolderOpen, Video, Brain } from 'lucide-react';
import SolutionPage from './SolutionPage';

const LegalSolutionPage = () => (
  <SolutionPage
    industry="Legal"
    headline="AI-Powered Practice Management for Law Firms"
    subtitle="Streamline legal operations with AI-powered meeting transcription for client consultations, eSignatures for contracts, centralized document management for case files, and enterprise-grade encryption for attorney-client privilege."
    description="Munal AI helps law firms, corporate legal departments, and compliance teams reduce billable-hour documentation, improve case management, and maintain strict confidentiality."
    metaTitle="Munal AI for Legal — AI Meeting Transcription, eSignatures, Case Document Management & Security"
    metaDescription="Munal AI for legal: AI transcription for client meetings, eSignatures for contracts, encrypted document management for case files, multi-step approval workflows, and AES-256 security for attorney-client privilege."
    ctaText="Start Free for Legal"
    heroImage="https://images.pexels.com/photos/5673490/pexels-photo-5673490.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    features={[
      { icon: Brain, title: "AI Meeting Transcription for Client Consultations", description: "Automatically transcribe client meetings, depositions, and partner conferences. AI extracts key points, action items, and case-relevant decisions to reduce manual documentation." },
      { icon: FileSignature, title: "eSignatures for Contracts & Legal Documents", description: "Execute contracts, retainer agreements, and legal forms with legally binding digital eSignatures. Multi-step approval workflows route documents through partners, associates, and clients." },
      { icon: FolderOpen, title: "Case File Document Management", description: "Centralize case files, contracts, briefs, and discovery documents in DocHub with version control, access permissions, and full-text search across all documents." },
      { icon: Shield, title: "AES-256 Encryption for Confidentiality", description: "Protect attorney-client privileged communications and sensitive case materials with AES-256 encryption, two-factor authentication, and comprehensive audit trails." },
      { icon: Clock, title: "Staff & Paralegal Scheduling", description: "Manage paralegal shifts, court date calendars, and associate workloads with smart scheduling. Track availability and ensure adequate staffing for case deadlines." },
      { icon: Video, title: "Training & Compliance Content", description: "Create continuing legal education (CLE) materials and compliance training videos from text prompts using AI-powered text-to-video and text-to-audio generation." }
    ]}
    useCases={[
      { title: "Client Meeting Documentation", description: "Automatically transcribe and summarize client consultations and case review meetings. AI extracts action items and key decisions, reducing billable documentation time." },
      { title: "Contract Execution & Approval", description: "Use eSignatures with multi-step approvals to execute contracts, NDAs, and retainer agreements. Route documents through partners, associates, and clients with full audit trails." },
      { title: "Case File Management", description: "Organize discovery documents, briefs, contracts, and correspondence in DocHub with encryption, version control, and role-based access for matter-specific permissions." },
      { title: "Paralegal & Staff Coordination", description: "Schedule paralegals, legal assistants, and associates across cases and court dates. Track workloads and manage availability for deadline-critical assignments." },
      { title: "CLE & Compliance Training", description: "Generate continuing legal education and internal compliance training content using AI text-to-video and text-to-audio for efficient professional development." }
    ]}
    faqs={[
      { q: "Is Munal AI secure enough for attorney-client privileged data?", a: "Yes. Munal AI uses AES-256 encryption for data at rest and in transit, two-factor authentication, role-based access control, and comprehensive audit logging. These security measures are designed to protect confidential legal communications and case materials." },
      { q: "Can Munal AI transcribe client meetings and depositions?", a: "Yes. Munal AI uses OpenAI Whisper for real-time transcription and GPT-5.2 for automatic summaries. It extracts key points, action items, and case-relevant decisions from client consultations, depositions, and internal meetings." },
      { q: "How do eSignatures work for legal documents?", a: "Munal AI provides legally binding digital eSignatures with full audit trails including timestamps, IP addresses, and signer verification. Multi-step approval workflows allow you to route contracts through multiple partners, associates, and clients for review and execution." },
      { q: "Can we manage case files in DocHub?", a: "Absolutely. DocHub provides centralized, encrypted storage for case files with version control, full-text search, access permissions, and PDF editing. You can organize documents by matter, client, or practice area." },
      { q: "Does Munal AI help with CLE compliance training?", a: "Yes. Use the text-to-video and text-to-audio features to create continuing legal education materials and internal compliance training content from text prompts, reducing the cost and time of professional development." }
    ]}
  />
);

export default LegalSolutionPage;
