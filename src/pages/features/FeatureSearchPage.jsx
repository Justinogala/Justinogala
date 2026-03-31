
import React from 'react';
import { Search, Filter, Clock, Zap } from 'lucide-react';
import FeaturePageLayout from '@/components/features/FeaturePageLayout';
import { API_URL } from '@/lib/api';

const FeatureSearchPage = () => {
  return (
    <FeaturePageLayout
      title="Search"
      subtitle="Intelligent Global Search"
      description="Stop digging through folders. Instantly find meetings, transcripts, messages, and files with our powerful, AI-driven search engine."
      heroImage={`${API_URL}/api/static/feature_search.png`}
      benefits={[
        { icon: Search, title: "Full-Text Search", description: "Search deep inside transcript contents, not just titles." },
        { icon: Filter, title: "Advanced Filters", description: "Filter by date, participant, meeting type, and more." },
        { icon: Zap, title: "Instant Results", description: "Get search results in milliseconds as you type." }
      ]}
      features={[
        { title: "Cross-Module Search", description: "Search across meetings, transcripts, files, and chats simultaneously." },
        { title: "Smart Suggestions", description: "AI predicts what you're looking for based on context." },
        { title: "Saved Searches", description: "Save complex queries for quick access later." },
        { title: "Context Highlighting", description: "See exactly where your keyword appears in the results." }
      ]}
      useCases={[
        { title: "Knowledge Retrieval", description: "Quickly find that one statistic mentioned months ago." },
        { title: "Compliance Audits", description: "Locate all discussions regarding specific topics." },
        { title: "Project Handoffs", description: "New members can easily search past project context." },
        { title: "Quick Reference", description: "Verify facts during ongoing meetings instantly." }
      ]}
      prevFeature={{ name: "Video Conferencing", link: "/features/video-conferencing" }}
      nextFeature={{ name: "Chat & Messaging", link: "/features/chat-messaging" }}
    />
  );
};

export default FeatureSearchPage;
