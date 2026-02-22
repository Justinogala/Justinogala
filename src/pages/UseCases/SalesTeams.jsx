
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import FeatureCard from '@/components/shared/FeatureCard';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Target, TrendingUp, Users, Zap } from 'lucide-react';

const SalesTeams = () => {
  return (
    <PageTransition>
      <Helmet>
        <title>Sales AI Note Taker - EchoNote AI</title>
        <meta name="description" content="Close more deals with AI-powered meeting notes, CRM updates, and sales coaching insights." />
      </Helmet>
      
      <Header />
      
      <PageHero 
        title="Close Deals Faster with AI Intelligence"
        subtitle="Automate CRM entry, capture objection handling, and coach your team to success with every call."
        backgroundImage="https://images.unsplash.com/photo-1552581234-26160f608093"
      >
        <div className="flex gap-4 justify-center mt-8">
           <button className="bg-accent text-white px-8 py-3 rounded-full font-medium hover:bg-accent/90 transition-colors">Start Free Trial</button>
        </div>
      </PageHero>

      <PageSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={Target}
            title="Auto-CRM Sync"
            description="Push meeting notes, deal highlights, and next steps directly to Salesforce, HubSpot, or Pipedrive."
            delay={0.1}
          />
          <FeatureCard 
            icon={TrendingUp}
            title="Deal Intelligence"
            description="Analyze sentiment and engagement to forecast deals more accurately."
            delay={0.2}
          />
          <FeatureCard 
            icon={Zap}
            title="Objection Handling"
            description="Real-time battle cards and post-call analysis on how competitors were discussed."
            delay={0.3}
          />
          <FeatureCard 
            icon={Users}
            title="Coaching Insights"
            description="Identify winning patterns and coach reps on talk-to-listen ratios."
            delay={0.4}
          />
        </div>
      </PageSection>

      <CTASection title="Ready to hit quota?" description="Join high-growth sales teams using EchoNote to win." />
      <Footer />
    </PageTransition>
  );
};

export default SalesTeams;
