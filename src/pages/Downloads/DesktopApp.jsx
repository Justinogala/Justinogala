
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Monitor, Apple, Command } from 'lucide-react';

const DesktopApp = () => {
  return (
    <PageTransition>
      <Helmet><title>Desktop App - EchoNote AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>
      
      <PageHero 
         title="EchoNote for Desktop" 
         subtitle="Powerful recording for any meeting platform, including Teams, Webex, and Slack Huddles."
      >
         <div className="flex gap-4 justify-center mt-8">
            <Button size="lg" className="gap-2">
               <Apple className="w-5 h-5" /> Download for Mac
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
               <Monitor className="w-5 h-5" /> Download for Windows
            </Button>
         </div>
      </PageHero>

      <PageSection>
         <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="order-2 md:order-1 rounded-xl overflow-hidden shadow-2xl border border-border">
               <img src="https://images.unsplash.com/photo-1610924125440-db821b18a56e" alt="Desktop App Interface" className="w-full" />
            </div>
            <div className="space-y-6 order-1 md:order-2">
               <h2 className="text-3xl font-bold text-text-primary">Native Performance</h2>
               <p className="text-text-secondary text-lg">The desktop app runs in the background and can record any audio playing on your system. Perfect for hybrid teams using multiple calling platforms.</p>
               <ul className="space-y-3">
                  {['Global hotkeys', 'System audio capture', 'Offline mode', 'Floating widget'].map(item => (
                     <li key={item} className="flex items-center gap-2 text-text-primary"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> {item}</li>
                  ))}
               </ul>
            </div>
         </div>
      </PageSection>

      <Footer />
    </PageTransition>
  );
};

export default DesktopApp;
