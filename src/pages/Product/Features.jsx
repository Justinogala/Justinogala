
import React from 'react';
import { Helmet } from 'react-helmet';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import { Check } from 'lucide-react';

const Features = () => {
  return (
    <PageTransition>
      <Helmet><title>Features - EchoNote AI</title></Helmet>
      <Header />
      
      {/* Custom Hero with Animated Background */}
      <section className="relative py-20 md:py-32 overflow-hidden flex items-center justify-center text-center">
        <AnimatedHeroBackground 
          gradientFrom="from-blue-600" 
          gradientTo="to-green-500"
        />
        <div className="container relative z-10 px-4">
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading text-text-primary">Powerful Features</h1>
           <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">Everything you need to turn meetings into knowledge.</p>
        </div>
      </section>

      <PageSection>
         <div className="space-y-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-text-primary">Accurate Transcription</h2>
                  <p className="text-text-secondary text-lg">Our AI models are trained on diverse accents and technical vocabulary to ensure every word is captured correctly.</p>
                  <ul className="space-y-2">
                     {['99% Accuracy', 'Speaker Identification', 'Custom Vocabulary'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-text-primary"><Check className="w-5 h-5 text-green-500" /> {f}</li>
                     ))}
                  </ul>
               </div>
               <div className="rounded-xl overflow-hidden shadow-2xl border border-border">
                  <img src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b" alt="Transcription Feature" className="w-full" />
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
               <div className="order-2 md:order-1 rounded-xl overflow-hidden shadow-2xl border border-border">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 aspect-video flex items-center justify-center text-slate-500">
                     Smart Summary Visualization
                  </div>
               </div>
               <div className="space-y-6 order-1 md:order-2">
                  <h2 className="text-3xl font-bold text-text-primary">Instant Summaries</h2>
                  <p className="text-text-secondary text-lg">Don't read the whole transcript. Get the gist, action items, and decisions made in seconds.</p>
                  <ul className="space-y-2">
                     {['Action Item Detection', 'Decision Log', 'Topic Segmentation'].map(f => (
                        <li key={f} className="flex items-center gap-2 text-text-primary"><Check className="w-5 h-5 text-green-500" /> {f}</li>
                     ))}
                  </ul>
               </div>
            </div>
         </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default Features;
