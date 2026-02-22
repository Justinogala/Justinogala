import React from 'react';
import { Helmet } from 'react-helmet';
import PageSection from '@/components/shared/PageSection';
import CTASection from '@/components/shared/CTASection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import { Users, Globe, Award, MapPin, Phone } from 'lucide-react';
import { contactConfig } from '@/config/contactConfig';

const About = () => {
  return (
    <PageTransition>
      <Helmet>
        <title>About Us - EchoNote AI</title>
      </Helmet>
      
      <Header />
      
      {/* Custom Hero with Animated Background */}
      <section className="relative py-20 md:py-32 overflow-hidden flex items-center justify-center text-center">
        <AnimatedHeroBackground 
          gradientFrom="from-orange-500" 
          gradientTo="to-blue-600"
        />
        <div className="container relative z-10 px-4">
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading text-text-primary">Our Mission</h1>
           <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">We're on a mission to eliminate busywork and help humans focus on creative, strategic work.</p>
        </div>
      </section>

      <PageSection>
        <div className="grid md:grid-cols-2 gap-12 items-center">
           <div>
              <h2 className="text-3xl font-bold font-heading mb-6 text-text-primary">The EchoNote Story</h2>
              <p className="text-text-secondary text-lg mb-4">Founded in 2024, we realized that 30% of meeting time is wasted on recap and note-taking. We asked ourselves: "What if your notes just... appeared?"</p>
              <p className="text-text-secondary text-lg mb-6">Today, EchoNote serves over 10,000 teams worldwide, processing millions of minutes of conversation every month.</p>
              
              <div className="grid grid-cols-3 gap-4 mt-8">
                 <div className="text-center">
                    <h3 className="text-3xl font-bold text-accent mb-1">10k+</h3>
                    <p className="text-sm text-text-secondary">Teams</p>
                 </div>
                 <div className="text-center">
                    <h3 className="text-3xl font-bold text-accent mb-1">5M+</h3>
                    <p className="text-sm text-text-secondary">Minutes</p>
                 </div>
                 <div className="text-center">
                    <h3 className="text-3xl font-bold text-accent mb-1">30+</h3>
                    <p className="text-sm text-text-secondary">Countries</p>
                 </div>
              </div>
           </div>
           <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1493882552576-fce827c6161e" alt="EchoNote Team" className="w-full h-full object-cover" />
           </div>
        </div>
      </PageSection>

      <PageSection background="alt">
         <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-text-primary">Our Values</h2>
            <p className="text-text-secondary">The principles that guide our product and culture.</p>
         </div>
         <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-bg-primary rounded-xl shadow-sm border border-border">
               <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                  <Users className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-2 text-text-primary">Customer Obsession</h3>
               <p className="text-text-secondary">We build what solves real problems, not just what's cool.</p>
            </div>
            <div className="p-8 bg-bg-primary rounded-xl shadow-sm border border-border">
               <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-6">
                  <Globe className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-2 text-text-primary">Global Mindset</h3>
               <p className="text-text-secondary">Talent is everywhere. We are a remote-first, diverse team.</p>
            </div>
            <div className="p-8 bg-bg-primary rounded-xl shadow-sm border border-border">
               <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-6">
                  <Award className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-2 text-text-primary">Quality First</h3>
               <p className="text-text-secondary">We'd rather ship late and right than early and broken.</p>
            </div>
         </div>
      </PageSection>

      {/* New Location Section */}
      <PageSection>
        <div className="max-w-4xl mx-auto text-center">
           <h2 className="text-3xl font-bold mb-8 text-text-primary">Visit Our HQ</h2>
           <div className="bg-bg-secondary p-8 rounded-2xl border border-border inline-flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="text-left">
                 <div className="flex items-center gap-3 mb-2 text-accent font-bold text-lg">
                    <MapPin className="w-5 h-5" />
                    <span>Headquarters</span>
                 </div>
                 <p className="text-text-secondary text-lg max-w-xs">{contactConfig.address}</p>
              </div>
              <div className="h-px w-full md:w-px md:h-24 bg-border"></div>
              <div className="text-left">
                 <div className="flex items-center gap-3 mb-2 text-accent font-bold text-lg">
                    <Phone className="w-5 h-5" />
                    <span>Contact</span>
                 </div>
                 <p className="text-text-secondary text-lg">{contactConfig.phone}</p>
                 <p className="text-text-secondary text-lg">{contactConfig.email}</p>
              </div>
           </div>
        </div>
      </PageSection>

      <CTASection title="Join our journey" primaryAction="View Careers" primaryLink="/company/careers" />
      <Footer />
    </PageTransition>
  );
};

export default About;