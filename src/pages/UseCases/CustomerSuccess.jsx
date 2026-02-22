
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import FeatureCard from '@/components/shared/FeatureCard';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Heart, MessageCircle, ShieldCheck, RefreshCw } from 'lucide-react';

const CustomerSuccess = () => {
  return (
    <PageTransition>
      <Helmet>
        <title>Customer Success AI - EchoNote AI</title>
      </Helmet>
      
      <Header />
      
      <PageHero 
        title="Delight Customers at Scale"
        subtitle="Ensure no customer request is lost. Track feature requests, sentiment, and renewal risks automatically."
        backgroundImage="https://images.unsplash.com/photo-1651009188116-bb5f80eaf6aa"
      />

      <PageSection>
        <div className="grid md:grid-cols-3 gap-8">
           <FeatureCard 
             icon={Heart}
             title="Sentiment Analysis"
             description="Track customer happiness over time to proactively prevent churn before it happens."
           />
           <FeatureCard 
             icon={MessageCircle}
             title="Voice of Customer"
             description="Automatically aggregate feature requests and pain points to share with Product teams."
           />
           <FeatureCard 
             icon={RefreshCw}
             title="Seamless Handoffs"
             description="Sales to CS handoffs made easy with full context from previous meeting history."
           />
        </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default CustomerSuccess;
