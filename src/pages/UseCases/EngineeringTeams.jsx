
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
import { Code, Terminal, GitMerge, FileCode } from 'lucide-react';

const EngineeringTeams = () => {
  return (
    <PageTransition>
      <Helmet><title>Engineering Teams - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero 
        title="Ship Faster with Clearer Requirements"
        subtitle="Capture technical decisions, architectural reviews, and sprint planning details without losing context."
      />

      <PageSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           <FeatureCard icon={Terminal} title="Tech Spec Generation" description="Turn brainstorming sessions into drafted technical specifications automatically." />
           <FeatureCard icon={GitMerge} title="Standup Summaries" description="Auto-extract blockers and updates from daily standups for your board." />
           <FeatureCard icon={Code} title="Code Context" description="Searchable history of why a specific architectural decision was made." />
           <FeatureCard icon={FileCode} title="Jira Integration" description="Push action items directly to Jira tickets from your meeting notes." />
        </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default EngineeringTeams;
