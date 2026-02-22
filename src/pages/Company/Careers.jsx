
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const Careers = () => {
  const positions = [
    { title: 'Senior Frontend Engineer', dept: 'Engineering', loc: 'Remote', type: 'Full-time' },
    { title: 'AI Research Scientist', dept: 'Data Science', loc: 'New York / Remote', type: 'Full-time' },
    { title: 'Product Designer', dept: 'Design', loc: 'Remote', type: 'Full-time' },
    { title: 'Account Executive', dept: 'Sales', loc: 'San Francisco', type: 'Full-time' },
  ];

  return (
    <PageTransition>
      <Helmet><title>Careers - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="Join Our Team" subtitle="Help us build the future of work. We're hiring dreamers and doers." />

      <PageSection>
         <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-text-primary">Open Positions</h2>
            <div className="space-y-4">
               {positions.map((job, i) => (
                  <Card key={i} className="hover:border-accent transition-colors cursor-pointer group">
                     <CardContent className="p-6 flex items-center justify-between">
                        <div>
                           <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">{job.title}</h3>
                           <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                              <span>{job.dept}</span>
                              <span>•</span>
                              <span>{job.loc}</span>
                              <span>•</span>
                              <span>{job.type}</span>
                           </div>
                        </div>
                        <Button variant="ghost" className="text-accent">Apply <ArrowRight className="w-4 h-4 ml-2" /></Button>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default Careers;
