import React from 'react';
import { AlertTriangle, FileText, Shield, BarChart } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';

const FeatureIRSORPage = () => {
  return (
    <FeaturePageLayout
      title="IR / SOR Reports"
      subtitle="Incident & Safety Occurrence Reporting"
      description="Report, track, and resolve workplace incidents and safety occurrences with customizable templates, escalation workflows, and compliance-ready documentation."
      heroImage="https://images.pexels.com/photos/5583617/pexels-photo-5583617.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      benefits={[
        { icon: AlertTriangle, title: "Quick Reporting", description: "File incident reports in minutes with guided form templates." },
        { icon: Shield, title: "Compliance Ready", description: "Meet regulatory requirements with standardized reporting formats." },
        { icon: BarChart, title: "Trend Analysis", description: "Identify patterns and prevent future incidents with analytics." }
      ]}
      features={[
        { title: "Custom Templates", description: "Admin-defined templates with custom fields for different incident types." },
        { title: "Auto-Escalation", description: "Critical incidents automatically escalate to senior management." },
        { title: "Photo & File Attachments", description: "Attach photos, documents, and evidence directly to reports." },
        { title: "Resolution Tracking", description: "Track corrective actions from assignment through completion." }
      ]}
      useCases={[
        { title: "Workplace Safety", description: "Document and track workplace injuries, near-misses, and hazards." },
        { title: "IT Security Incidents", description: "Report data breaches, system outages, and security events." },
        { title: "Quality Control", description: "Track product defects and manufacturing non-conformances." },
        { title: "Compliance Audits", description: "Generate compliance reports with full incident history." }
      ]}
      prevFeature={{ name: "Shifts", link: "/features/shifts" }}
      nextFeature={{ name: "Notifications", link: "/features/notifications" }}
    />
  );
};

export default FeatureIRSORPage;
