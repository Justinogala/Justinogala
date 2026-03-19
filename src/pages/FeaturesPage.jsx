import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Mic, Video, Search, MessageSquare, Users, FileText, 
  BarChart, Calendar, Radio, LayoutGrid, Zap, CheckCircle2, ArrowRight,
  Clock, Building2, Shield, Bell, CreditCard, ClipboardList,
  AudioLines, Clapperboard, PenLine, FileOutput, FolderOpen,
  Headphones, MessagesSquare, LayoutDashboard, CircleDot, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageTransition from '@/components/PageTransition';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "A unified command center with real-time metrics, recent activity, and quick-access shortcuts to all your tools.",
    benefits: ["Activity overview", "Quick-access widgets", "Real-time stats"],
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/10"
  },
  {
    icon: CircleDot,
    title: "Quick Record",
    desc: "Instantly capture audio notes, voice memos, and meeting snippets with one-tap recording and AI transcription.",
    benefits: ["One-tap recording", "AI transcription", "Auto-save & organize"],
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-900/10"
  },
  {
    icon: AudioLines,
    title: "Text to Audio",
    desc: "Convert any text into natural-sounding speech with multiple voice options and adjustable speed controls.",
    benefits: ["6 natural voices", "Speed control", "Download as MP3"],
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/10"
  },
  {
    icon: Clapperboard,
    title: "Text to Video",
    desc: "Generate AI-powered videos from text prompts using Sora 2, with voice narration and resolution options.",
    benefits: ["AI video generation", "Voice selection & preview", "Multiple resolutions"],
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-900/10"
  },
  {
    icon: Clock,
    title: "Shift Management",
    desc: "Create, assign, and manage shifts across your entire organization with drag-and-drop scheduling.",
    benefits: ["Visual calendar view", "Clock-in/out tracking", "Timesheet reports"],
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/10"
  },
  {
    icon: Building2,
    title: "Workspaces",
    desc: "Organize teams into dedicated workspaces with their own members, channels, and resources.",
    benefits: ["Team isolation", "Custom settings", "Member management"],
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/10"
  },
  {
    icon: MessageSquare,
    title: "Messages",
    desc: "Full-featured email-style messaging with AI Smart Replies, drafting, CC/BCC, attachments, and conversation threading.",
    benefits: ["AI Smart Replies & Draft", "File attachments & drag-drop", "CC/BCC support"],
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/10"
  },
  {
    icon: MessagesSquare,
    title: "Chat",
    desc: "Real-time team chat with instant messaging, emoji reactions, and quick file sharing.",
    benefits: ["Real-time messaging", "Emoji reactions", "Quick file sharing"],
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-900/10"
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    desc: "Unified calendar for meetings, shifts, and events with AI-powered scheduling suggestions.",
    benefits: ["Multi-view calendar", "Meeting scheduling", "Shift integration"],
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-900/10"
  },
  {
    icon: Video,
    title: "Meetings",
    desc: "Schedule, manage, and track meetings with agenda templates, participant tracking, and meeting history.",
    benefits: ["Meeting history", "Agenda management", "Participant tracking"],
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/10"
  },
  {
    icon: FileText,
    title: "AI Transcriptions",
    desc: "Convert meeting audio into searchable text with speaker identification and smart summaries.",
    benefits: ["99% accuracy", "Action item extraction", "Searchable archive"],
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/10"
  },
  {
    icon: Headphones,
    title: "Voice Chat",
    desc: "Live voice conversations with team members for quick discussions without scheduling a formal meeting.",
    benefits: ["Instant voice calls", "Low-latency audio", "Background noise reduction"],
    color: "text-lime-500",
    bg: "bg-lime-50 dark:bg-lime-900/10"
  },
  {
    icon: FolderOpen,
    title: "File Management",
    desc: "Centralized file storage with upload, organize, preview, and share capabilities across your workspace.",
    benefits: ["Drag-drop upload", "File preview", "Team sharing"],
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800/30"
  },
  {
    icon: PenLine,
    title: "eSignature",
    desc: "Upload, sign, and manage PDF documents with draw, type, or upload signature options and signing history.",
    benefits: ["Draw/type/upload signatures", "PDF signing & stamping", "Signature management"],
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-900/10"
  },
  {
    icon: FileOutput,
    title: "Document Conversion",
    desc: "Convert documents between Word and PDF formats instantly with conversion history and re-download capability.",
    benefits: ["Word to PDF", "PDF to Word", "Conversion history"],
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-900/10"
  },
  {
    icon: AlertTriangle,
    title: "IR / SOR Reports",
    desc: "Incident and Safety Occurrence reporting with escalation workflows, notifications, and analytics dashboards.",
    benefits: ["Escalation workflow", "PDF/Excel export", "Incident analytics"],
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/10"
  },
  {
    icon: Shield,
    title: "Admin Portal",
    desc: "Comprehensive admin dashboard with user management, audit logs, and moderation tools.",
    benefits: ["Role-based permissions", "Real-time audit logs", "Chat moderation"],
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/10"
  },
  {
    icon: BarChart,
    title: "Analytics & Reports",
    desc: "Deep insights into workforce productivity, shift coverage, and team engagement metrics.",
    benefits: ["Usage reports", "Shift analytics", "Export capabilities"],
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-900/10"
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Smart notification system for shift reminders, messages, and important updates in real-time.",
    benefits: ["In-app real-time alerts", "Email notifications", "Custom preferences"],
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/10"
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    desc: "Flexible billing with team plans, annual discounts, and usage-based alerts.",
    benefits: ["Multiple tiers", "Team billing", "Usage tracking"],
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/10"
  }
];

const FeaturesPage = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
        <Helmet>
          <title>Features | Munal - AI-Powered Workforce Platform</title>
        </Helmet>
        
        <Header />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative py-24 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10" />
            
            <div className="container mx-auto px-6 relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                  Powerful Features for Growing Teams
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                  From shift scheduling to AI-powered meeting insights, everything you need to manage your workforce and boost team collaboration in one unified platform.
                </p>
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8 shadow-lg shadow-violet-500/25">
                  Start Free Trial
                </Button>
              </motion.div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-24 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 rounded-2xl overflow-hidden">
                      <CardContent className="p-8 flex flex-col h-full">
                        <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className={`w-7 h-7 ${feature.color}`} />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          {feature.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow leading-relaxed">
                          {feature.desc}
                        </p>
                        
                        <div className="space-y-3 mb-6">
                          {feature.benefits.map((benefit, i) => (
                            <div key={i} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <CheckCircle2 className="w-4 h-4 mr-2 text-violet-500" />
                              {benefit}
                            </div>
                          ))}
                        </div>

                        <a href="#" className="inline-flex items-center text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700 dark:hover:text-violet-300 transition-colors mt-auto group-hover:translate-x-1 duration-200">
                          Learn more <ArrowRight className="w-4 h-4 ml-1" />
                        </a>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Ready to transform your workforce management?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join organizations using Munal to streamline shifts, improve collaboration, and gain actionable insights.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="bg-violet-600 hover:bg-violet-700">Get Started Now</Button>
                <Button size="lg" variant="outline">Contact Sales</Button>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default FeaturesPage;