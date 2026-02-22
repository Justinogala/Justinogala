
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Documentation = () => {
  return (
    <PageTransition>
      <Helmet><title>Documentation - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="Documentation" align="left" className="pb-10 pt-10 lg:pt-16">
         <div className="max-w-xl mt-6 relative">
            <Search className="absolute left-3 top-3 text-text-secondary w-5 h-5" />
            <Input className="pl-10 h-12 bg-bg-secondary border-border" placeholder="Search documentation..." />
         </div>
      </PageHero>

      <PageSection className="pt-0">
        <div className="grid lg:grid-cols-4 gap-8">
           <div className="lg:col-span-1 space-y-2">
              <h3 className="font-bold text-text-primary mb-4">Categories</h3>
              {['Getting Started', 'Account Management', 'Integrations', 'Troubleshooting', 'Security'].map(item => (
                 <div key={item} className="p-2 hover:bg-bg-secondary rounded cursor-pointer text-text-secondary hover:text-text-primary transition-colors">{item}</div>
              ))}
           </div>
           <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold mb-6 text-text-primary">Getting Started</h2>
              <div className="space-y-6">
                 <Card>
                    <CardContent className="p-6">
                       <h3 className="text-xl font-bold mb-2 text-text-primary">Quick Start Guide</h3>
                       <p className="text-text-secondary mb-4">Learn how to set up your account and record your first meeting in under 5 minutes.</p>
                       <a href="#" className="text-accent hover:underline">Read article →</a>
                    </CardContent>
                 </Card>
                 <Card>
                    <CardContent className="p-6">
                       <h3 className="text-xl font-bold mb-2 text-text-primary">Connecting Your Calendar</h3>
                       <p className="text-text-secondary mb-4">Automatically sync your Google or Outlook calendar to never miss a meeting.</p>
                       <a href="#" className="text-accent hover:underline">Read article →</a>
                    </CardContent>
                 </Card>
              </div>
           </div>
        </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default Documentation;
