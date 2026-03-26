import React, { useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import HeroBackground from '@/components/HeroBackground';
import DemoVideoModal from '@/components/DemoVideoModal';

// Lazy load below-the-fold sections
const BenefitsSection = lazy(() => import('@/components/landing/BenefitsSection'));
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection'));
const PricingSection = lazy(() => import('@/components/landing/PricingSection'));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection'));
const StatsSection = lazy(() => import('@/components/landing/StatsSection'));

const LandingPage = () => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

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
            {/* Soft pastel gradient background */}
            <HeroBackground />

            <div className="container mx-auto px-6 relative z-10 pt-20 pb-24 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
              >
                <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight tracking-tight">
                  Manage, Collaborate, <br className="hidden md:block" />
                  and <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Scale Your Team</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                  The all-in-one AI-powered unified communication and workforce platform designed to replace multiple workplace tools with a single integrated system.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/signup')}
                    className="h-14 px-8 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                  >
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    data-testid="watch-demo-btn"
                    onClick={() => setDemoOpen(true)}
                    className="h-14 px-8 text-lg border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-white/10 rounded-full backdrop-blur-sm"
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
          <Suspense fallback={null}>
            <StatsSection />
          </Suspense>

          {/* Benefits Section */}
          <div id="features">
            <Suspense fallback={null}>
              <BenefitsSection />
            </Suspense>
          </div>

          {/* How It Works Section */}
          <Suspense fallback={null}>
            <HowItWorksSection />
          </Suspense>

          {/* Testimonials Section */}
          <Suspense fallback={null}>
            <TestimonialsSection />
          </Suspense>

          {/* Pricing Section */}
          <Suspense fallback={null}>
            <PricingSection />
          </Suspense>

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
        <DemoVideoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
      </div>
    </PageTransition>
  );
};

export default LandingPage;