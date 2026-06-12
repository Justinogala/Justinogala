
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import PageSection from '@/components/shared/PageSection';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, Wifi, Mic, BarChart3, Shield, Bell, Zap } from 'lucide-react';
import { presets } from '@/utils/animations';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.jiffix.munalai.app&hl=en_CA';

const features = [
  { icon: Mic, title: 'High-quality voice recording', desc: 'Crystal-clear audio capture optimized for meetings and lectures' },
  { icon: BarChart3, title: 'Instant mobile summaries', desc: 'AI-powered transcription and key-point extraction on the go' },
  { icon: Wifi, title: 'Seamless sync', desc: 'Automatically syncs with your web dashboard in real-time' },
  { icon: Bell, title: 'Smart notifications', desc: 'Meeting reminders and follow-up alerts keep you on track' },
  { icon: Shield, title: 'Secure & private', desc: 'End-to-end encryption protects your recordings and data' },
  { icon: Zap, title: 'Background recording', desc: 'Continue recording while using other apps on your device' },
];

const MobileApp = () => {
  return (
    <PageTransition>
      <Helmet><title>Mobile App - Munal AI</title></Helmet>
      <Header />
      <div className="container mx-auto px-6"><BreadcrumbNav /></div>

      {/* Hero Section - with background image */}
      <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-24 overflow-hidden" data-testid="mobile-app-hero">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1614851099511-773084f6911d?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium mb-6 border border-white/20"
              {...presets.fadeInUp}
            >
              <Download className="w-4 h-4" />
              Available on Android
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              data-testid="mobile-hero-title"
            >
              Munal AI on the Go
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Record in-person meetings, lectures, and ideas wherever you are.
              Your AI workspace — always in your pocket.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Button
                size="lg"
                className="gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-violet-500/20 text-base"
                onClick={() => window.open('#', '_blank')}
                data-testid="ios-download-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                iOS App Store
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2.5 border-2 px-8 py-3 rounded-xl text-base hover:bg-gray-50 dark:hover:bg-slate-800"
                onClick={() => window.open(PLAY_STORE_URL, '_blank')}
                data-testid="google-play-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.83.52-1.28 1-1.5l10 10-10 10c-.48-.22-1-.67-1-1.5zm15.5-8.5L6.15 3.69 14.5 12l-8.35 8.31L18.5 12zM6.15 3.69l12.36 6.91c.6.33.6.87 0 1.2L6.15 20.31"/></svg>
                Google Play
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <PageSection>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-text-primary">Your Pocket Assistant</h2>
            <p className="text-text-secondary text-lg">Turn your phone into a powerful AI recorder. Syncs instantly with your web dashboard so your notes are ready when you get back to your desk.</p>
            <ul className="space-y-3">
              {['High-quality voice recording', 'Instant mobile summaries', 'Widget support', 'Background recording'].map(item => (
                <li key={item} className="flex items-center gap-2 text-text-primary"><div className="w-1.5 h-1.5 rounded-full bg-accent" /> {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl overflow-hidden shadow-2xl border border-border max-w-sm mx-auto">
            <img src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&q=80" alt="Person using Munal AI on smartphone" className="w-full" />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-6 rounded-xl border border-border bg-bg-primary hover:shadow-lg hover:border-accent/30 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </PageSection>

      {/* Download CTA */}
      <section className="py-16 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">Download Munal AI and transform how you capture and manage meetings.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2 bg-white text-violet-700 hover:bg-gray-100 px-8 rounded-xl" onClick={() => window.open('#', '_blank')}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-2 border-white text-white hover:bg-white/10 px-8 rounded-xl" onClick={() => window.open(PLAY_STORE_URL, '_blank')}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.83.52-1.28 1-1.5l10 10-10 10c-.48-.22-1-.67-1-1.5zm15.5-8.5L6.15 3.69 14.5 12l-8.35 8.31L18.5 12zM6.15 3.69l12.36 6.91c.6.33.6.87 0 1.2L6.15 20.31"/></svg>
              Google Play
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default MobileApp;
