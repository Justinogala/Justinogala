import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, Sparkles, Users, Link as LinkIcon, Search, Shield, 
  Plug, Circle, Brain, Share2, Check, Star 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import PageTransition from '@/components/PageTransition';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import { useInView } from '@/hooks/useInView';
import { EASING } from '@/utils/animations';

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Mic, title: "AI Transcription", desc: "Industry-leading accuracy for over 30 languages." },
    { icon: Sparkles, title: "Smart Summaries", desc: "Instant executive summaries of key discussion points." },
    { icon: Users, title: "Real-time Collab", desc: "Comment, edit, and highlight transcripts together." },
    { icon: LinkIcon, title: "Seamless Integration", desc: "Works with Zoom, Google Meet, and Microsoft Teams." },
    { icon: Search, title: "Powerful Search", desc: "Find any spoken word or topic across all meetings." },
    { icon: Shield, title: "Enterprise Security", desc: "SOC2 Type II certified with end-to-end encryption." }
  ];

  const steps = [
    { icon: Plug, title: "Connect", desc: "Link your calendar or join a meeting directly." },
    { icon: Circle, title: "Record", desc: "Munal bot joins and records high-quality audio." },
    { icon: Brain, title: "Analyze", desc: "AI processes speech, speakers, and sentiment." },
    { icon: Share2, title: "Share", desc: "Distribute summaries and action items to your team." }
  ];

  const testimonials = [
    { name: "Sarah Chen", role: "Product VP, TechCorp", quote: "Munal has completely transformed our product syncs. We save at least 20 hours a week on documentation." },
    { name: "Marcus Johnson", role: "Founder, StartupXYZ", quote: "The accuracy is insane. Even with our team's mix of accents, it captures everything perfectly." },
    { name: "Emily Rodriguez", role: "Sales Director, GlobalCorp", quote: "Action items never slip through the cracks anymore. My sales team is 30% more efficient." }
  ];

  // InView Hooks
  const featuresRef = useInView();
  const howItWorksRef = useInView();
  const pricingRef = useInView();
  const testimonialsRef = useInView();

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden flex flex-col">
      <Helmet>
        <title>Munal - Transform Your Meetings</title>
      </Helmet>

      <Header />

      <PageTransition>
        {/* Hero Section */}
        <section className="relative pt-[4rem] md:pt-[5rem] lg:pt-[5rem] pb-24 lg:pb-32 overflow-hidden flex-grow">
          {/* Animated Background */}
          <AnimatedHeroBackground 
            gradientFrom="from-purple-600" 
            gradientTo="to-pink-600"
            animationSpeed="slow"
          />

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 xl:gap-20">
              {/* Left Column: Text & CTA */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASING.easeOut }}
                className="lg:w-1/2 text-center lg:text-left order-2 lg:order-1"
              >
                <motion.h1 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-purple-500 to-pink-600"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  Transform Your Meetings Into Actionable Insights
                </motion.h1>
                <motion.p 
                  className="text-lg md:text-xl text-text-secondary mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  AI-powered transcription, summarization, and collaboration for modern teams with Munal. Never take manual notes again.
                </motion.p>
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Button onClick={() => navigate('/signup')} className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-500/25 w-full sm:w-auto">
                    Start Free Trial
                  </Button>
                  <Button onClick={() => console.log('Demo')} variant="outline" className="h-14 px-8 text-lg border-2 rounded-full hover:bg-bg-secondary transition-all w-full sm:w-auto">
                    Watch Demo
                  </Button>
                </motion.div>
                <motion.div 
                  className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-text-secondary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" /> No credit card required
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4 text-green-500" /> 14-day free trial
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: Hero Carousel */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.4, delay: 0.6, ease: EASING.easeOut }}
                className="lg:w-1/2 w-full order-1 lg:order-2"
              >
                 <HeroCarousel />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-bg-secondary/50" ref={featuresRef.ref}>
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: -20 }}
              animate={featuresRef.isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-text-primary">Supercharge Your Productivity with Munal</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">Everything you need to capture, organize, and act on your meeting data.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={featuresRef.isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                >
                  <Card 
                    hover 
                    className="h-full border border-border bg-bg-primary"
                  >
                    <CardContent className="p-8">
                      <motion.div 
                        className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6"
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={featuresRef.isInView ? { rotate: 0, opacity: 1 } : {}}
                        transition={{ duration: 0.8, delay: 0.2 + (i * 0.1) }}
                      >
                        <feature.icon className="w-7 h-7 text-accent" />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-3 text-text-primary">{feature.title}</h3>
                      <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 relative overflow-hidden" ref={howItWorksRef.ref}>
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold font-heading text-text-primary">How Munal Works</h2>
            </div>

            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border -translate-x-1/2 hidden md:block" />

              <div className="space-y-12 md:space-y-24">
                {steps.map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                    animate={howItWorksRef.isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8, delay: i * 0.2 }}
                    className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                  >
                    <div className="flex-1 text-center md:text-right">
                      {i % 2 === 0 && (
                        <div className="md:pr-12">
                          <h3 className="text-2xl font-bold mb-2 text-text-primary">{step.title}</h3>
                          <p className="text-text-secondary">{step.desc}</p>
                        </div>
                      )}
                    </div>
                    
                    <motion.div 
                      className="relative z-10 w-16 h-16 rounded-full bg-bg-primary border-4 border-accent flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <step.icon className="w-8 h-8 text-accent" />
                    </motion.div>

                    <div className="flex-1 text-center md:text-left">
                      {i % 2 === 1 && (
                        <div className="md:pl-12">
                          <h3 className="text-2xl font-bold mb-2 text-text-primary">{step.title}</h3>
                          <p className="text-text-secondary">{step.desc}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-bg-secondary/50" ref={pricingRef.ref}>
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-text-primary">Munal Pricing</h2>
              <p className="text-lg text-text-secondary">Start free, upgrade as you grow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free */}
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={pricingRef.isInView ? { opacity: 1, y: 0 } : {}}
                 transition={{ delay: 0.1 }}
              >
                <Card 
                  hover 
                  className="h-full border border-border bg-bg-primary"
                >
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">Free</h3>
                    <div className="text-4xl font-bold text-text-primary mb-6">$0<span className="text-lg text-text-secondary font-normal">/mo</span></div>
                    <ul className="space-y-4 mb-8">
                      {['10 hours/month', 'Basic Transcription', '1 User'].map((f) => (
                        <li key={f} className="flex items-center gap-3 text-text-secondary">
                          <Check className="w-5 h-5 text-green-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => navigate('/signup')} variant="outline" className="w-full">Get Started</Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pro */}
              <motion.div
                 initial={{ opacity: 0, y: 20, scale: 0.9 }}
                 animate={pricingRef.isInView ? { opacity: 1, y: 0, scale: 1.05 } : {}}
                 transition={{ delay: 0.2 }}
                 className="z-10"
              >
                <Card className="bg-bg-primary border-2 border-accent p-8 relative shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-text-primary mb-6">$29<span className="text-lg text-text-secondary font-normal">/mo</span></div>
                  <ul className="space-y-4 mb-8">
                    {['100 hours/month', 'Advanced Summaries', 'Unlimited Exports', 'Priority Support'].map((f) => (
                      <li key={f} className="flex items-center gap-3 text-text-secondary">
                        <Check className="w-5 h-5 text-green-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => navigate('/signup')} className="w-full bg-accent hover:bg-blue-600 text-white">Start Free Trial</Button>
                </Card>
              </motion.div>

              {/* Business */}
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={pricingRef.isInView ? { opacity: 1, y: 0 } : {}}
                 transition={{ delay: 0.3 }}
              >
                <Card 
                  hover 
                  className="h-full bg-bg-primary border border-border"
                >
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">Business</h3>
                    <div className="text-4xl font-bold text-text-primary mb-6">Custom</div>
                    <ul className="space-y-4 mb-8">
                      {['Unlimited hours', 'Custom Integrations', 'Dedicated Success Mgr', 'SSO & Audit Logs'].map((f) => (
                        <li key={f} className="flex items-center gap-3 text-text-secondary">
                          <Check className="w-5 h-5 text-green-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => console.log('Contact Sales')} variant="outline" className="w-full">Contact Sales</Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 overflow-hidden" ref={testimonialsRef.ref}>
          <div className="container mx-auto px-4 sm:px-6">
             <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-bold font-heading text-text-primary">Loved by Teams Using Munal</h2>
             </div>
             
             <div className="max-w-4xl mx-auto relative">
               <div className="overflow-hidden">
                 <motion.div 
                   key={activeTestimonial}
                   initial={{ opacity: 0, x: 100 }}
                   animate={testimonialsRef.isInView ? { opacity: 1, x: 0 } : {}}
                   exit={{ opacity: 0, x: -100 }}
                   transition={{ duration: 0.5 }}
                   className="text-center p-8"
                 >
                   <div className="flex justify-center gap-1 mb-6">
                     {[...Array(5)].map((_, i) => (
                       <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                       >
                         <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                       </motion.div>
                     ))}
                   </div>
                   <blockquote className="text-xl md:text-3xl italic text-text-primary mb-8 leading-relaxed">
                     "{testimonials[activeTestimonial].quote}"
                   </blockquote>
                   <div className="flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mb-4" />
                     <cite className="not-italic">
                       <div className="font-bold text-lg text-text-primary">{testimonials[activeTestimonial].name}</div>
                       <div className="text-text-secondary">{testimonials[activeTestimonial].role}</div>
                     </cite>
                   </div>
                 </motion.div>
               </div>
               
               {/* Indicators */}
               <div className="flex justify-center gap-2 mt-8">
                 {testimonials.map((_, i) => (
                   <button 
                     key={i} 
                     onClick={() => setActiveTestimonial(i)}
                     className={`w-3 h-3 rounded-full transition-all ${i === activeTestimonial ? 'bg-accent w-6' : 'bg-border'}`} 
                     aria-label={`View testimonial ${i + 1}`}
                   />
                 ))}
               </div>
             </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold font-heading mb-6">Ready to Transform Your Meetings with Munal?</h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Join thousands of high-performing teams using Munal to work smarter.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Button onClick={() => navigate('/signup')} className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto">Get Started Now</Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-bg-primary pt-16 pb-12 border-t border-border">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-bold">M</div>
                  <span className="font-bold text-text-primary">Munal</span>
                </div>
                <p className="text-text-secondary text-sm">Empowering teams with intelligent meeting insights.</p>
              </div>
              <div>
                <h4 className="font-bold text-text-primary mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><a href="#" className="hover:text-accent transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-text-primary mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">API Docs</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-text-primary mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-accent transition-colors">Legal</a></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
              <div className="text-sm text-text-secondary mb-4 md:mb-0">© 2024 Munal. All rights reserved.</div>
              <div className="flex items-center gap-6">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </footer>
      </PageTransition>
    </div>
  );
};

export default HomePage;