
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Press = () => {
  return (
    <PageTransition>
      <Helmet><title>Press - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero title="Press & Media" subtitle="News, updates, and resources for media." />

      <PageSection>
         <div className="grid md:grid-cols-2 gap-12">
            <div>
               <h2 className="text-2xl font-bold mb-6 text-text-primary">Recent News</h2>
               <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                     <div key={i} className="border-b border-border pb-6 last:border-0">
                        <span className="text-sm text-text-secondary block mb-2">Feb 1, 2026</span>
                        <h3 className="text-xl font-bold text-text-primary mb-2 hover:text-accent cursor-pointer">EchoNote Raises Series B to Expand AI Capabilities</h3>
                        <p className="text-text-secondary">Leading VC firm joins our mission to automate meeting intelligence.</p>
                     </div>
                  ))}
               </div>
            </div>
            <div>
               <h2 className="text-2xl font-bold mb-6 text-text-primary">Media Kit</h2>
               <Card className="bg-bg-secondary border-none">
                  <CardContent className="p-8">
                     <p className="text-text-secondary mb-6">Download our brand assets, including logos, product screenshots, and executive headshots.</p>
                     <Button className="w-full gap-2">
                        <Download className="w-4 h-4" /> Download Brand Assets
                     </Button>
                     
                     <div className="mt-8">
                        <h4 className="font-bold text-text-primary mb-2">Press Contact</h4>
                        <p className="text-text-secondary">press@echonote.ai</p>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default Press;
