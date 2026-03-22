
import React from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import BreadcrumbNav from '@/components/shared/BreadcrumbNav';
import { motion } from 'framer-motion';
import {
  Users, Globe, Award, MapPin, Phone, Mail, Heart,
  Target, Lightbulb, Shield, ArrowRight, Zap, Clock,
  Video, FileText, CheckCircle, BarChart, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { contactConfig } from '@/config/contactConfig';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const StatCard = ({ value, label, delay }) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="text-center"
  >
    <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-1">{value}</h3>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
  </motion.div>
);

const About = () => {
  return (
    <PageTransition>
      <Helmet><title>About Us | Munal AI</title></Helmet>
      <Header />

      <div className="container mx-auto px-6"><BreadcrumbNav /></div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-violet-50/85 to-white/95 dark:from-slate-950/92 dark:via-violet-950/85 dark:to-slate-900/95" />
        </div>
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-950/50 rounded-full mb-6">
                <Heart className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Our Story</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                We're Building the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Teamwork</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Munal AI is a division of Jiffix Inc., on a mission to eliminate busywork so teams can focus on what truly matters — creative, strategic, human work.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-14 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="10k+" label="Teams Worldwide" delay={0} />
            <StatCard value="5M+" label="Minutes Processed" delay={0.1} />
            <StatCard value="30+" label="Countries" delay={0.2} />
            <StatCard value="99.9%" label="Uptime SLA" delay={0.3} />
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-3 block">The Origin</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">The Munal AI Story</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  Founded in 2024, we noticed a staggering problem: <strong className="text-gray-900 dark:text-white">30% of meeting time</strong> is wasted on recap and note-taking. We asked ourselves — what if your notes just appeared?
                </p>
                <p>
                  That question sparked Munal AI. What started as an AI transcription tool has grown into a <strong className="text-gray-900 dark:text-white">comprehensive workforce platform</strong> — covering meetings, approvals, shift scheduling, eSignatures, incident reports, and more.
                </p>
                <p>
                  Today, Munal AI serves over 10,000 teams across 30+ countries, processing millions of minutes of conversation every month. And we're just getting started.
                </p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                <img src="https://images.unsplash.com/photo-1758873269317-51888e824b28?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwdGVhbSUyMG1lZXRpbmclMjBkaXNjdXNzaW9uJTIwbW9kZXJufGVufDB8fHx8MTc3NDEzOTExNXww&ixlib=rb-4.1.0&q=85" alt="Munal AI Team" className="w-full aspect-[4/3] object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">What We Do</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">One platform for everything your team needs to collaborate, manage, and grow.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Video, title: "Meetings & Video Calls", desc: "HD video conferencing with AI transcription and meeting summaries." },
              { icon: CheckCircle, title: "Approvals & Workflows", desc: "Multi-step approval chains with delegation and AI analytics." },
              { icon: Calendar, title: "Shifts & Scheduling", desc: "Smart shift management with availability tracking and auto-reminders." },
              { icon: FileText, title: "eSignature & Docs", desc: "Legally-binding Canadian-compliant digital signatures." },
              { icon: BarChart, title: "Analytics & Insights", desc: "Real-time dashboards with AI-powered trend analysis." },
              { icon: Shield, title: "Enterprise Security", desc: "AES-256 encryption, RBAC, and comprehensive audit trails." },
              { icon: Users, title: "Workspaces", desc: "Isolated team spaces with file management and permissions." },
              { icon: Zap, title: "AI-Powered Everything", desc: "GPT-powered insights, transcription, and automation." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:shadow-lg hover:shadow-violet-500/5 group">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <item.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Our Values</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">The principles that guide our product and culture.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Target, title: "Customer Obsession", desc: "We build what solves real problems, not just what's cool. Every feature starts with a user pain point.", color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { icon: Globe, title: "Global & Remote-First", desc: "Talent is everywhere. We're a diverse, distributed team spanning continents and time zones.", color: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
              { icon: Award, title: "Quality Over Speed", desc: "We'd rather ship late and right than early and broken. Reliability is a feature.", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            ].map((v, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow overflow-hidden">
                  <div className={`h-1.5 bg-gradient-to-r ${v.color}`} />
                  <CardContent className="p-7">
                    <div className={`w-12 h-12 rounded-xl ${v.bg} flex items-center justify-center mb-5`}>
                      <v.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950/50">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Our Journey</h2>
          </motion.div>
          <div className="max-w-2xl mx-auto space-y-0">
            {[
              { year: "2024", title: "Founded", desc: "Munal AI launched as an AI transcription tool by Jiffix Inc." },
              { year: "2024", title: "Core Platform", desc: "Added meetings, video calls, workspaces, and team messaging." },
              { year: "2025", title: "Workforce Tools", desc: "Launched approvals, shift scheduling, eSignatures, and IR/SOR reports." },
              { year: "2026", title: "AI & Scale", desc: "GPT-powered analytics, 10k+ teams, multi-language expansion underway." },
            ].map((m, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-violet-600 dark:bg-violet-500 border-4 border-white dark:border-gray-900 shadow-md" />
                  {i < 3 && <div className="w-0.5 flex-1 bg-violet-200 dark:bg-violet-800" />}
                </div>
                <div className="pb-10">
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{m.year}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{m.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HQ & Contact */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Visit Our HQ</h2>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto">
            <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Headquarters</h3>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{contactConfig.address}</p>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Contact</h3>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{contactConfig.phone}</p>
                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" /> {contactConfig.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-white to-violet-50/50 dark:from-slate-900 dark:to-violet-950/10">
        <div className="container mx-auto px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-2xl mx-auto">
            <Lightbulb className="w-12 h-12 text-violet-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Join Our Journey</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">We're always looking for talented people who share our vision. Come build the future of teamwork with us.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-full px-8 gap-2" onClick={() => window.location.href = '/company/careers'}>
                View Careers <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" onClick={() => window.location.href = '/contact'}>
                Get in Touch
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
};

export default About;
