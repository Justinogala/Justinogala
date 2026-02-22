
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Chrome, Monitor, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DownloadsIndex = () => {
  const downloads = [
    { title: 'Chrome Extension', icon: Chrome, desc: 'Record Google Meet & Zoom directly from your browser.', link: '/downloads/chrome-extension' },
    { title: 'Desktop App', icon: Monitor, desc: 'Native app for Windows, Mac, and Linux with system audio capture.', link: '/downloads/desktop-app' },
    { title: 'Mobile App', icon: Smartphone, desc: 'Record in-person meetings on iOS and Android.', link: '/downloads/mobile-app' },
  ];

  return (
    <PageTransition>
      <Helmet><title>Downloads - EchoNote AI</title></Helmet>
      <Header />
      <PageHero title="Download EchoNote" subtitle="Get the apps you need to capture meetings anywhere." />
      
      <PageSection>
        <div className="grid md:grid-cols-3 gap-8">
          {downloads.map((item, i) => (
            <Card key={i} className="text-center h-full border-border">
               <CardContent className="p-8 flex flex-col items-center h-full">
                  <div className="w-20 h-20 bg-bg-secondary rounded-2xl flex items-center justify-center mb-6">
                     <item.icon className="w-10 h-10 text-text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">{item.title}</h3>
                  <p className="text-text-secondary mb-8 flex-grow">{item.desc}</p>
                  <Link to={item.link} className="w-full">
                     <Button className="w-full gap-2">
                        <Download className="w-4 h-4" /> Download
                     </Button>
                  </Link>
               </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default DownloadsIndex;
