import React from 'react';
import { PenLine, Shield, Clock, FileCheck } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureESignaturePage = () => {
  return (
    <FeaturePageLayout
      title="eSignature"
      subtitle="Legally Binding Digital Signatures"
      description="Sign documents digitally with full legal compliance under Canadian law. Send, track, and manage electronic signatures with complete audit trails and secure storage."
      heroImage="https://images.unsplash.com/photo-1450101499163-c8848c66ca85"
      benefits={[
        { icon: PenLine, title: "Draw or Type", description: "Sign with your mouse, touchscreen, or type your name for instant signatures." },
        { icon: Shield, title: "Legally Compliant", description: "Fully compliant with Canadian PIPEDA and provincial electronic commerce acts." },
        { icon: Clock, title: "Instant Delivery", description: "Send documents for signature and get them back in minutes, not days." }
      ]}
      features={[
        { title: "Document Upload", description: "Upload PDFs and documents, place signature fields, and send for signing." },
        { title: "Signing History", description: "Complete audit trail with timestamps, IP addresses, and signer details." },
        { title: "Multi-Signer Support", description: "Route documents to multiple signers in sequence or parallel." },
        { title: "Template Library", description: "Save frequently used documents as templates for quick reuse." }
      ]}
      useCases={[
        { title: "Employment Contracts", description: "Onboard new hires with digital offer letters and NDAs." },
        { title: "Client Agreements", description: "Close deals faster with instant digital contract signing." },
        { title: "Policy Acknowledgments", description: "Get team-wide sign-offs on updated policies and procedures." },
        { title: "Vendor Contracts", description: "Streamline procurement with quick vendor agreement signatures." }
      ]}
      prevFeature={{ name: "Approvals", link: "/features/approvals" }}
      nextFeature={{ name: "Shifts", link: "/features/shifts" }}
    />
  );
};

export default FeatureESignaturePage;
