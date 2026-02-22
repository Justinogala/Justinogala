
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import FeatureCard from '@/components/shared/FeatureCard';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Chrome, Star } from 'lucide-react';

const ChromeExtension = () => {
  return (
    <PageTransition>
      <Helmet><title>Chrome Extension - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero 
         title="EchoNote for Chrome" 
         subtitle="The easiest way to record and transcribe Google Meet and Zoom calls."
      >
         <div className="flex flex-col items-center gap-4 mt-8">
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
               <Chrome className="w-5 h-5" /> Add to Chrome - It's Free
            </Button>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
               <div className="flex text-yellow-400"><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /><Star className="fill-current w-4 h-4" /></div>
               <span>5.0 (2,000+ ratings)</span>
            </div>
         </div>
      </PageHero>

      <PageSection>
         <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
               <h2 className="text-3xl font-bold text-text-primary">Seamless Integration</h2>
               <p className="text-text-secondary text-lg">Never worry about inviting a bot again. The EchoNote Chrome Extension sits quietly in your browser and captures system audio directly for the highest quality transcription.</p>
               <ul className="space-y-3">
                  {['One-click recording', 'Works with Google Meet & Zoom', 'Real-time highlights', 'Instant summaries'].map(item => (
                     <li key={item} className="flex items-center gap-2 text-text-primary"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> {item}</li>
                  ))}
               </ul>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border">
               <img src="https://images.unsplash.com/photo-1675022991860-ad46e3e9c150" alt="Chrome Extension Interface" className="w-full" />
            </div>
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default ChromeExtension;
