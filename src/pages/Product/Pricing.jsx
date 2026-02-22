
import React from 'react';
import { Helmet } from 'react-helmet';
import PageHero from '@/components/shared/PageHero';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const Pricing = () => {
  return (
    <PageTransition>
      <Helmet><title>Pricing - EchoNote AI</title></Helmet>
      <Header />
      
      <PageHero title="Simple, Transparent Pricing" subtitle="Choose the plan that fits your team's needs." />

      <PageSection>
         <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <Card className="border-border p-6 flex flex-col">
               <div className="mb-6">
                  <h3 className="text-2xl font-bold text-text-primary">Starter</h3>
                  <div className="text-4xl font-bold mt-4 text-text-primary">$0</div>
                  <p className="text-text-secondary mt-2">Forever free for individuals.</p>
               </div>
               <Button variant="outline" className="w-full mb-8">Get Started</Button>
               <ul className="space-y-4 flex-grow">
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> 10 meetings / month</li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> Basic summaries</li>
                  <li className="flex gap-3 text-sm text-text-secondary"><X className="w-5 h-5 text-gray-400 shrink-0" /> CRM Integration</li>
               </ul>
            </Card>

            {/* Pro */}
            <Card className="border-accent p-6 flex flex-col relative shadow-xl transform md:-translate-y-4 bg-bg-secondary">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-3 py-1 rounded-full text-sm font-bold">Popular</div>
               <div className="mb-6">
                  <h3 className="text-2xl font-bold text-text-primary">Pro</h3>
                  <div className="text-4xl font-bold mt-4 text-text-primary">$29<span className="text-lg font-normal text-text-secondary">/mo</span></div>
                  <p className="text-text-secondary mt-2">For growing teams.</p>
               </div>
               <Button className="w-full mb-8 bg-accent hover:bg-blue-600 text-white">Start Free Trial</Button>
               <ul className="space-y-4 flex-grow">
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> Unlimited meetings</li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> Advanced AI insights</li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> CRM Integration</li>
               </ul>
            </Card>

            {/* Business */}
            <Card className="border-border p-6 flex flex-col">
               <div className="mb-6">
                  <h3 className="text-2xl font-bold text-text-primary">Enterprise</h3>
                  <div className="text-4xl font-bold mt-4 text-text-primary">Custom</div>
                  <p className="text-text-secondary mt-2">For large organizations.</p>
               </div>
               <Button variant="outline" className="w-full mb-8">Contact Sales</Button>
               <ul className="space-y-4 flex-grow">
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> Everything in Pro</li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> SSO & Audit Logs</li>
                  <li className="flex gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> Dedicated Success Manager</li>
               </ul>
            </Card>
         </div>
      </PageSection>

      <CTASection />
      <Footer />
    </PageTransition>
  );
};

export default Pricing;
