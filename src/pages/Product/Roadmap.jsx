
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const Roadmap = () => {
  const roadmap = [
    { quarter: 'Q2 2026', status: 'In Progress', items: ['Custom Vocabulary V2', 'Microsoft Teams App', 'Zapier Integration'] },
    { quarter: 'Q3 2026', status: 'Planned', items: ['Sentiment Trends Dashboard', 'Multi-language Support (Asian)', 'Mobile App Redesign'] },
    { quarter: 'Q4 2026', status: 'Future', items: ['Real-time Coaching Assistant', 'API Webhooks V2', 'Enterprise On-premise'] },
  ];

  return (
    <PageTransition>
      <Helmet><title>Roadmap - EchoNote AI</title></Helmet>
      <Header />
      
      <PageHero title="Product Roadmap" subtitle="See what we're building next." />

      <PageSection>
         <div className="grid md:grid-cols-3 gap-8">
            {roadmap.map((phase, i) => (
               <div key={i} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-2xl font-bold text-text-primary">{phase.quarter}</h3>
                     <Badge variant={phase.status === 'In Progress' ? 'default' : 'secondary'}>{phase.status}</Badge>
                  </div>
                  {phase.items.map((item, j) => (
                     <Card key={j}>
                        <CardContent className="p-4 font-medium text-text-primary">
                           {item}
                        </CardContent>
                     </Card>
                  ))}
               </div>
            ))}
         </div>
      </PageSection>

      <CTASection title="Have a feature request?" description="We build based on your feedback." primaryAction="Submit Request" primaryLink="#" secondaryAction="Join Community" secondaryLink="/resources/community" />
      <Footer />
    </PageTransition>
  );
};

export default Roadmap;
