
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import FeatureCard from '@/components/shared/FeatureCard';
import CTASection from '@/components/shared/CTASection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { UserCheck, FileText, Briefcase, Users } from 'lucide-react';

const HRRecruiting = () => {
  return (
    <PageTransition>
      <Helmet><title>HR & Recruiting - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero 
        title="Focus on the Candidate, Not the Notes"
        subtitle="Interview intelligence that helps you hire the best talent while capturing every detail."
      />

      <PageSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           <FeatureCard icon={Users} title="Interview Transcripts" description="Full searchable transcripts of every candidate interview for review." />
           <FeatureCard icon={FileText} title="Scorecard Filling" description="AI suggests scorecard ratings based on candidate responses." />
           <FeatureCard icon={UserCheck} title="Bias Detection" description="Analyze interview questions to ensure fair and inclusive hiring practices." />
           <FeatureCard icon={Briefcase} title="ATS Sync" description="Sync notes and summaries directly to Greenhouse, Lever, or Ashby." />
        </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default HRRecruiting;
