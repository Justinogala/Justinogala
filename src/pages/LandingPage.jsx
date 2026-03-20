import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import FloatingOrbs from '@/components/FloatingOrbs';

// Import Section Components
import BenefitsSection from '@/components/landing/BenefitsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import PricingSection from '@/components/landing/PricingSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import StatsSection from '@/components/landing/StatsSection';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col overflow-x-hidden">
        <Helmet>
          <title>Munal - AI-Powered Workforce & Collaboration Platform</title>
        </Helmet>
        
        <Header />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1688733720228-4f7a18681c4f" 
                alt="Modern Tech Workspace" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/80 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-violet-900/50 backdrop-blur-sm" />
            </div>

            {/* Floating Orbs Animation */}
            <div className="absolute inset-0 z-[1]">
              <FloatingOrbs />
            </div>

            <div className="container mx-auto px-6 relative z-10 pt-20 pb-24 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
              >
                <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 text-white leading-tight tracking-tight">
                  Manage, Collaborate, <br className="hidden md:block" />
                  and <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Scale Your Team</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
                  The AI-powered workforce platform that combines intelligent meeting assistance, shift scheduling, time tracking, and team collaboration in one seamless experience.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/signup')}
                    className="h-14 px-8 text-lg bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-lg shadow-violet-500/30 transition-all hover:scale-105"
                  >
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="h-14 px-8 text-lg border-white text-white hover:bg-white/10 rounded-full backdrop-blur-sm"
                  >
                    <PlayCircle className="mr-2 w-5 h-5" /> Watch Demo
                  </Button>
                </div>
                
                <div className="mt-12 text-sm text-gray-400 font-medium">
                  Trusted by teams managing shifts, meetings, and collaboration worldwide
                </div>
              </motion.div>
            </div>
            
            {/* Scroll Indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                <div className="w-1 h-2 bg-white/50 rounded-full" />
              </div>
            </motion.div>
          </section>

          {/* Stats Section */}
          <StatsSection />

          {/* Benefits Section */}
          <div id="features">
            <BenefitsSection />
          </div>

          {/* How It Works Section */}
          <HowItWorksSection />

          {/* Testimonials Section */}
          <TestimonialsSection />

          {/* Pricing Section */}
          <PricingSection />

          {/* Final CTA */}
          <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-900/50 to-purple-900/50" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">Start Your Free Trial Today</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                No credit card required. Cancel anytime. Join the productivity revolution.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/signup')}
                className="h-14 px-10 text-lg bg-white text-slate-900 hover:bg-gray-100 rounded-full shadow-xl transition-all hover:scale-105"
              >
                Get Started Now
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default LandingPage;