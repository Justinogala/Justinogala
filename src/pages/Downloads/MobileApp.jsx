
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

const MobileApp = () => {
  return (
    <PageTransition>
      <Helmet><title>Mobile App - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero 
         title="EchoNote on the Go" 
         subtitle="Record in-person meetings, lectures, and ideas wherever you are."
      >
         <div className="flex gap-4 justify-center mt-8">
            <Button size="lg" className="gap-2">
               <Smartphone className="w-5 h-5" /> iOS App Store
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
               <Smartphone className="w-5 h-5" /> Google Play
            </Button>
         </div>
      </PageHero>

      <PageSection>
         <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
               <h2 className="text-3xl font-bold text-text-primary">Your Pocket Assistant</h2>
               <p className="text-text-secondary text-lg">Turn your phone into a powerful AI recorder. Syncs instantly with your web dashboard so your notes are ready when you get back to your desk.</p>
               <ul className="space-y-3">
                  {['High-quality voice recording', 'Instant mobile summaries', 'Widget support', 'Background recording'].map(item => (
                     <li key={item} className="flex items-center gap-2 text-text-primary"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> {item}</li>
                  ))}
               </ul>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border max-w-sm mx-auto">
               <img src="https://images.unsplash.com/photo-1600783245891-f275a1575d93" alt="Mobile App Interface" className="w-full" />
            </div>
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default MobileApp;
