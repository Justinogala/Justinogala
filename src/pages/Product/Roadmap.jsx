
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import { motion } from 'framer-motion';
import { 
  Rocket, CheckCircle, Clock, Sparkles, ArrowRight,
  Brain, CalendarClock, Languages, Smartphone, Mic2,
  BarChart3, Zap, Building2, Bot, Workflow, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const phaseConfig = {
  'In Progress': { color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', glow: 'shadow-emerald-500/10', dot: 'bg-emerald-500', pulse: true },
  'Planned': { color: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', glow: 'shadow-violet-500/10', dot: 'bg-violet-500', pulse: false },
  'Future': { color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', glow: 'shadow-amber-500/10', dot: 'bg-amber-500', pulse: false },
};

const roadmap = [
  {
    quarter: 'Q2 2026',
    status: 'In Progress',
    items: [
      { title: 'Custom Vocabulary V2', desc: 'Enhanced transcription accuracy with industry-specific terminology and custom dictionaries.', icon: Mic2 },
      { title: 'AI Meeting Summarizer', desc: 'Auto-generate meeting summaries with action items, decisions, and key takeaways.', icon: Brain },
      { title: 'Smart Shift Auto-Scheduling', desc: 'AI suggests optimal shift assignments based on availability, workload, and preferences.', icon: CalendarClock },
    ]
  },
  {
    quarter: 'Q3 2026',
    status: 'Planned',
    items: [
      { title: 'Sentiment Trends Dashboard', desc: 'Track team morale and communication sentiment over time with visual analytics.', icon: BarChart3 },
      { title: 'Multi-language Support', desc: 'Full Asian language support — Japanese, Korean, Mandarin, and Hindi transcriptions.', icon: Languages },
      { title: 'Mobile App Redesign', desc: 'Reimagined mobile experience with offline mode, push notifications, and biometric login.', icon: Smartphone },
    ]
  },
  {
    quarter: 'Q4 2026',
    status: 'Future',
    items: [
      { title: 'Real-time Coaching Assistant', desc: 'Live AI coaching during meetings — prompts, talking pace, and engagement scoring.', icon: Bot },
      { title: 'API Webhooks V2', desc: 'Event-driven webhooks for approvals, recordings, shifts, and custom workflow triggers.', icon: Workflow },
      { title: 'Enterprise On-Premise', desc: 'Self-hosted deployment option with air-gapped security for regulated industries.', icon: Building2 },
    ]
  }
];

const Roadmap = () => {
  return (
    <PageTransition>
      <Helmet><title>Roadmap | Munal AI</title></Helmet>
      <Header />

      <div className="container mx-auto px-6"><BreadcrumbNav /></div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1771875802948-0d0f3424fe6d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwdGVjaG5vbG9neSUyMGFic3RyYWN0JTIwZGFyayUyMHB1cnBsZXxlbnwwfHx8fDE3NzQxMzg2MTN8MA&ixlib=rb-4.1.0&q=85" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-violet-50/85 to-white/95 dark:from-slate-950/92 dark:via-violet-950/80 dark:to-slate-900/95" />
        </div>
        <div className="container mx-auto px-6 py-20 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-950/50 rounded-full mb-6">
              <Rocket className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">What We're Building</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-5 tracking-tight">
              Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Roadmap</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Transparency drives trust. Here's exactly what's in progress, planned, and on the horizon for Munal AI.
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Planned</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Future</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="space-y-20">
            {roadmap.map((phase, phaseIdx) => {
              const cfg = phaseConfig[phase.status];
              return (
                <motion.div
                  key={phaseIdx}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: phaseIdx * 0.1 }}
                >
                  {/* Phase Header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {cfg.pulse && (
                          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: 'rgb(16 185 129)' }}></span>
                        )}
                        <span className={`relative block w-4 h-4 rounded-full ${cfg.dot}`}></span>
                      </div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white">{phase.quarter}</h2>
                    </div>
                    <Badge className={`${cfg.bg} ${cfg.text} border ${cfg.border} font-semibold px-3 py-1`}>
                      {phase.status === 'In Progress' && <Clock className="w-3 h-3 mr-1.5" />}
                      {phase.status === 'Planned' && <Sparkles className="w-3 h-3 mr-1.5" />}
                      {phase.status === 'Future' && <Rocket className="w-3 h-3 mr-1.5" />}
                      {phase.status}
                    </Badge>
                  </div>

                  {/* Items Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {phase.items.map((item, itemIdx) => (
                      <motion.div
                        key={itemIdx}
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: itemIdx * 0.08 }}
                        className={`group relative rounded-2xl border ${cfg.border} bg-white dark:bg-gray-900 p-6 hover:shadow-xl ${cfg.glow} transition-all hover:-translate-y-1`}
                      >
                        {/* Top accent line */}
                        <div className={`absolute top-0 left-6 right-6 h-0.5 ${cfg.color} rounded-b opacity-50 group-hover:opacity-100 transition-opacity`} />

                        <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon className={`w-6 h-6 ${cfg.text}`} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-white to-violet-50/50 dark:from-slate-900 dark:to-violet-950/10">
        <div className="container mx-auto px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto">
            <Sparkles className="w-12 h-12 text-violet-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Have a Feature Request?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">We build based on your feedback. Tell us what you need and help shape the future of Munal AI.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-full px-8 gap-2" onClick={() => window.location.href = '/contact'}>
                Submit a Request <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" onClick={() => window.location.href = '/resources/community'}>
                Join Our Community
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default Roadmap;
