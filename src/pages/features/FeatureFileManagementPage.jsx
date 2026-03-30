
import React from 'react';
import { FileText, Folder, Upload, ShieldCheck } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureFileManagementPage = () => {
  return (
    <FeaturePageLayout
      title="File Management"
      subtitle="Secure Cloud Storage"
      description="Store, organize, and share your documents securely. Access your important files from anywhere, integrated directly with your meetings."
      heroImage={`${API_URL}/api/static/feature_files.png`}
      benefits={[
        { icon: Folder, title: "Smart Organization", description: "Keep files sorted with folders and tags." },
        { icon: ShieldCheck, title: "Secure Access", description: "Bank-level encryption for all stored data." },
        { icon: Upload, title: "Easy Upload", description: "Drag-and-drop support for large files." }
      ]}
      features={[
        { title: "Version Control", description: "Track changes and revert to previous versions if needed." },
        { title: "File Previews", description: "View documents and images without downloading them." },
        { title: "Granular Permissions", description: "Set view-only or edit access per file or folder." },
        { title: "Global Search", description: "Find files by name, type, or content instantly." }
      ]}
      useCases={[
        { title: "Project Assets", description: "Central repository for design files and specs." },
        { title: "Meeting Attachments", description: "Link relevant docs directly to calendar events." },
        { title: "Compliance Storage", description: "Securely archive legal and financial records." },
        { title: "Knowledge Base", description: "Build a library of internal resources and guides." }
      ]}
      prevFeature={{ name: "Teams", link: "/features/teams" }}
      nextFeature={{ name: "Analytics", link: "/features/analytics" }}
    />
  );
};

export default FeatureFileManagementPage;
