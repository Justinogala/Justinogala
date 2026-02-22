
import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlanComparison from '@/components/PlanComparison';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import PageTransition from '@/components/PageTransition';

const PaymentPage = () => {
  const navigate = useNavigate();

  const handleSelectPlan = (planId) => {
    navigate(`/checkout/${planId}`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>Plans & Pricing - Munal</title>
          <meta name="description" content="Choose the perfect plan for your meeting transcription and AI summary needs." />
        </Helmet>
        
        <Header />
        
        <main className="flex-grow relative">
          <AnimatedHeroBackground gradientFrom="from-emerald-900/10" gradientTo="to-teal-900/10" />
          
          <div className="container mx-auto px-4 py-16 relative z-10">
            {/* Hero */}
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                Simple, Transparent Pricing
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-text-secondary"
              >
                Start for free, upgrade as you grow. No hidden fees.
              </motion.p>
            </div>

            {/* Plans */}
            <div className="mb-24">
              <PlanComparison onSelectPlan={handleSelectPlan} />
            </div>

            {/* Features Detail */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-text-primary">Everything you need to master your meetings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  "Unlimited Secure Storage",
                  "99.9% Uptime Guarantee",
                  "Export to PDF, TXT, DOCX",
                  "Multi-language Support (50+)",
                  "Advanced AI Summaries",
                  "Team Collaboration Tools"
                ].map((feature, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3 p-4 bg-card/30 rounded-lg border border-border"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="font-medium text-text-primary">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-text-primary flex items-center justify-center gap-2">
                  <HelpCircle className="w-8 h-8 text-emerald-500" />
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border p-6 shadow-lg">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Can I switch plans later?</AccordionTrigger>
                    <AccordionContent>
                      Yes, you can upgrade or downgrade your plan at any time. Changes will take effect immediately, and we'll prorate any payments.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Is my data secure?</AccordionTrigger>
                    <AccordionContent>
                      Absolutely. We use enterprise-grade encryption for all data in transit and at rest. Your meetings are private and secure.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
                    <AccordionContent>
                      We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact support for a full refund.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>What happens to my data if I cancel?</AccordionTrigger>
                    <AccordionContent>
                      If you cancel, you will retain access to your data until the end of your billing cycle. Afterward, your account will revert to the Free plan limits.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default PaymentPage;
