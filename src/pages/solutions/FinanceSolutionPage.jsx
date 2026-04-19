import React from 'react';
import { Shield, Clock, FileSignature, FolderOpen, Video, Brain } from 'lucide-react';
import SolutionPage from './SolutionPage';

const FinanceSolutionPage = () => (
  <SolutionPage
    industry="Finance"
    headline="AI-Powered Workflow Automation for Financial Services"
    subtitle="Modernize financial operations with AI meeting documentation for compliance, smart shift scheduling for branch operations, eSignatures for financial agreements, encrypted document storage, and comprehensive audit trail reporting."
    description="Munal AI helps banks, investment firms, insurance companies, and financial institutions streamline operations, ensure regulatory compliance, and protect sensitive financial data."
    metaTitle="Munal AI for Finance — AI Compliance Documentation, Shift Scheduling, eSignatures & Encrypted Storage"
    metaDescription="Munal AI for finance: AI meeting documentation for compliance, shift scheduling for branch operations, eSignatures for financial agreements, AES-256 encrypted document storage, and audit trail reporting."
    ctaText="Start Free for Finance"
    heroImage="https://images.unsplash.com/photo-1659241869140-3cb7cdff42fd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHxmaW5hbmNlJTIwdGVhbSUyMG9mZmljZSUyMGJhbmtpbmclMjB0ZWNobm9sb2d5fGVufDB8fHx8MTc3NjYxNDc1OXww&ixlib=rb-4.1.0&q=85"
    features={[
      { icon: Brain, title: "AI Meeting Documentation for Compliance", description: "Automatically transcribe and summarize compliance meetings, risk reviews, and board sessions. AI-generated summaries with action items create auditable records for regulatory requirements." },
      { icon: Clock, title: "Shift Scheduling for Branch Operations", description: "Manage branch staffing, teller schedules, and support team rotations with visual drag-and-drop scheduling. Real-time coverage tracking ensures service continuity." },
      { icon: FileSignature, title: "eSignatures for Financial Agreements", description: "Execute loan documents, account agreements, and compliance forms with legally binding digital eSignatures. Multi-step approvals route through compliance, legal, and management." },
      { icon: FolderOpen, title: "Encrypted Document Storage & Management", description: "Store financial records, audit documents, and client files in DocHub with AES-256 encryption, version control, and granular access permissions for regulatory compliance." },
      { icon: Shield, title: "Comprehensive Audit Trail Reporting", description: "Maintain detailed audit logs of all user actions, document access, and approval workflows. Generate compliance reports for regulatory audits and internal reviews." },
      { icon: Video, title: "Training Content for Compliance & Onboarding", description: "Create compliance training videos and onboarding materials from text prompts using AI. Keep staff current on regulatory changes and internal policies." }
    ]}
    useCases={[
      { title: "Regulatory Compliance Meeting Documentation", description: "Automatically transcribe and summarize compliance committee meetings, risk assessments, and board reviews. AI-generated records with action items serve as auditable documentation for regulators." },
      { title: "Branch Operations Staffing", description: "Schedule tellers, advisors, and branch managers across multiple locations with smart shift management. Track coverage gaps and manage shift swaps to ensure service continuity." },
      { title: "Loan & Account Agreement Execution", description: "Process loan applications, account openings, and financial agreements with eSignatures and multi-step approval workflows that route through compliance, underwriting, and management." },
      { title: "Financial Record Management", description: "Centralize audit documents, client records, and regulatory filings in DocHub with AES-256 encryption. Role-based access ensures only authorized personnel access sensitive financial data." },
      { title: "Staff Compliance Training", description: "Generate compliance training videos and policy update content using AI text-to-video. Ensure all staff complete required training with trackable delivery." }
    ]}
    faqs={[
      { q: "Does Munal AI meet financial industry security standards?", a: "Yes. Munal AI uses AES-256 encryption for data at rest and in transit, two-factor authentication, role-based access control, and comprehensive audit logging. These measures support SOC 2 alignment and financial regulatory compliance requirements." },
      { q: "Can Munal AI help with compliance meeting documentation?", a: "Absolutely. Munal AI automatically transcribes and summarizes compliance meetings with AI-generated action items and decisions. These records serve as auditable documentation for regulatory reviews and internal compliance programs." },
      { q: "How does shift scheduling work for bank branches?", a: "Munal AI provides visual drag-and-drop scheduling with day, week, and month views. You can manage teller schedules, advisor rotations, and branch manager coverage across multiple locations with automated reminders and real-time gap alerts." },
      { q: "Can we execute loan documents with eSignatures?", a: "Yes. Munal AI supports legally binding digital eSignatures with full audit trails. Multi-step approval workflows route loan applications and financial agreements through compliance, underwriting, and management for review and execution." },
      { q: "How does DocHub protect sensitive financial records?", a: "DocHub provides AES-256 encrypted storage with version control, granular access permissions, and full audit logging. Only authorized users can access sensitive documents, and all access is logged for compliance reporting." },
      { q: "Can we create compliance training content with Munal AI?", a: "Yes. Use text-to-video and text-to-audio to create compliance training, policy updates, and onboarding materials from text prompts. This reduces the cost and time of keeping staff current on regulatory requirements." }
    ]}
  />
);

export default FinanceSolutionPage;
