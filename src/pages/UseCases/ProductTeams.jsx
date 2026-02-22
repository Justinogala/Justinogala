
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Lightbulb, Search, GitBranch } from 'lucide-react';

const ProductTeams = () => {
  return (
    <PageTransition>
      <Helmet>
        <title>Product Teams - EchoNote AI</title>
      </Helmet>
      
      <Header />
      
      <PageHero 
        title="Build What Matters"
        subtitle="Connect directly with user feedback. Search thousands of customer conversations to validate features."
        backgroundImage="https://images.unsplash.com/photo-1573166364839-1bfe9196c23e"
      />

      <PageSection background="alt">
        <div className="container mx-auto px-6 max-w-4xl">
           <div className="flex flex-col gap-12">
              <div className="flex items-start gap-6">
                 <div className="p-4 bg-blue-100 rounded-xl text-blue-600"><Search className="w-8 h-8" /></div>
                 <div>
                    <h3 className="text-2xl font-bold mb-2 text-text-primary">Universal Search</h3>
                    <p className="text-text-secondary text-lg">Don't guess what users want. Search "mobile app crash" across 500 sales calls to see the real impact.</p>
                 </div>
              </div>
              <div className="flex items-start gap-6">
                 <div className="p-4 bg-purple-100 rounded-xl text-purple-600"><Lightbulb className="w-8 h-8" /></div>
                 <div>
                    <h3 className="text-2xl font-bold mb-2 text-text-primary">Feature Validation</h3>
                    <p className="text-text-secondary text-lg">Clip exact moments where users describe a problem and share it with your engineering squad.</p>
                 </div>
              </div>
           </div>
        </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default ProductTeams;
