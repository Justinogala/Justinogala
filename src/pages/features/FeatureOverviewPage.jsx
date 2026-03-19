
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, Video, Search, MessageSquare, Users, FileText, 
  BarChart, Calendar, LayoutGrid, Zap, ArrowRight, Volume2,
  Briefcase, HardDrive, Shield, Bot, CloudCog, Smartphone, Film,
  Clock, Bell, CreditCard, Building2, AudioLines, CircleDot,
  Headphones, MessagesSquare, PenLine, FileOutput, AlertTriangle,
  LayoutDashboard, Clapperboard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const featuresList = [
  // Dashboard & Quick Tools
  { icon: LayoutDashboard, title: "Dashboard", desc: "A unified command center with real-time metrics, recent activity, and quick-access shortcuts to all your tools.", link: "/dashboard", color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-900/20", badge: "NEW" },
  { icon: CircleDot, title: "Quick Record", desc: "Instantly capture audio notes, voice memos, and meeting snippets with one-tap recording and AI transcription.", link: "/quick-record", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/20", badge: "NEW" },

  // AI Features
  { icon: AudioLines, title: "Text to Audio", desc: "Convert any text into natural-sounding speech with 6 voice options, adjustable speed, and MP3 download.", link: "/text-to-audio", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/20", badge: "NEW" },
  { icon: Clapperboard, title: "Text to Video", desc: "Generate stunning AI videos from text using Sora 2 with voice narration selection and preview.", link: "/text-to-video", color: "text-fuchsia-500", bg: "bg-fuchsia-100 dark:bg-fuchsia-900/20", badge: "NEW" },
  { icon: FileText, title: "AI Transcriptions", desc: "Automatic speech-to-text with speaker identification. Smart meeting summaries and action item extraction.", link: "/features/transcriptions", color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-900/20" },
  { icon: Bot, title: "AI Assistant", desc: "Chat with AI about your meetings and content. Get summaries, action items, and intelligent insights.", link: "/features/analytics", color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/20" },

  // Workforce Management
  { icon: Clock, title: "Shift Management", desc: "Schedule shifts, track clock-in/out, and manage timesheets across your entire workforce with visual calendar views.", link: "/features/meetings", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/20" },
  { icon: Building2, title: "Workspaces", desc: "Create team workspaces for organized collaboration. Each workspace has its own members, channels, and resources.", link: "/features/teams", color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/20" },
  { icon: Users, title: "Team Management", desc: "Invite members, assign roles, and control access with granular permissions. Built for teams of all sizes.", link: "/features/teams", color: "text-cyan-500", bg: "bg-cyan-100 dark:bg-cyan-900/20" },

  // Communication
  { icon: MessageSquare, title: "Messages", desc: "Full-featured messaging with AI Smart Replies, AI Draft, CC/BCC, file attachments with drag-and-drop.", link: "/features/chat-messaging", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20" },
  { icon: MessagesSquare, title: "Chat", desc: "Real-time team chat with instant messaging, emoji reactions, and quick file sharing across workspaces.", link: "/features/chat-messaging", color: "text-sky-500", bg: "bg-sky-100 dark:bg-sky-900/20" },
  { icon: Headphones, title: "Voice Chat", desc: "Live voice conversations with team members for quick discussions without scheduling a formal meeting.", link: "/features/chat-messaging", color: "text-lime-500", bg: "bg-lime-100 dark:bg-lime-900/20" },
  { icon: Bell, title: "Smart Notifications", desc: "Real-time in-app and email notifications for shift reminders, messages, incidents, and important updates.", link: "/features/meetings", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20" },

  // Calendar & Meetings
  { icon: Calendar, title: "Smart Calendar", desc: "Unified calendar for meetings, shifts, and events. AI-powered scheduling suggestions and conflict detection.", link: "/features/calendar-integration", color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/20" },
  { icon: Video, title: "Meetings", desc: "Schedule, manage, and track meetings with agenda templates, participant tracking, and full meeting history.", link: "/features/video-conferencing", color: "text-pink-500", bg: "bg-pink-100 dark:bg-pink-900/20" },

  // Documents & Signatures
  { icon: PenLine, title: "eSignature", desc: "Upload, sign, and manage PDF documents with draw, type, or upload signature options and signing history.", link: "/esignature", color: "text-violet-500", bg: "bg-violet-100 dark:bg-violet-900/20", badge: "NEW" },
  { icon: FileOutput, title: "Document Conversion", desc: "Convert between Word and PDF formats instantly. Word to PDF, PDF to Word, with full conversion history.", link: "/esignature", color: "text-cyan-500", bg: "bg-cyan-100 dark:bg-cyan-900/20", badge: "NEW" },
  { icon: HardDrive, title: "File Management", desc: "Secure cloud storage for documents and files. Upload, organize, and share with your team.", link: "/features/file-management", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-900/20" },

  // IR/SOR & Reporting
  { icon: AlertTriangle, title: "IR / SOR Reports", desc: "Incident and Safety Occurrence reporting with escalation workflows, PDF/Excel export, and analytics dashboards.", link: "/ir-sor", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20", badge: "NEW" },
  { icon: Shield, title: "Admin Portal", desc: "Comprehensive admin dashboard with user management, chat moderation, audit logs, and role-based permissions.", link: "/features/analytics", color: "text-rose-500", bg: "bg-rose-100 dark:bg-rose-900/20" },
  { icon: BarChart, title: "Analytics & Reports", desc: "Deep insights into workforce productivity, shift coverage, and team engagement. Export reports and track trends.", link: "/features/analytics", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/20" },

  // Billing & Platform
  { icon: CreditCard, title: "Billing & Subscriptions", desc: "Flexible plans with team billing, annual discounts, and usage-based alerts. Stripe-powered payments.", link: "/pricing", color: "text-teal-500", bg: "bg-teal-100 dark:bg-teal-900/20" },
  { icon: Search, title: "Smart Search", desc: "Find anything across meetings, transcriptions, and files. Full-text search with advanced filters.", link: "/features/search", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/20" },
  { icon: Smartphone, title: "Mobile Responsive", desc: "Access all features on any device. Fully optimized for desktop, tablet, and mobile experiences.", link: "/features/meetings", color: "text-lime-500", bg: "bg-lime-100 dark:bg-lime-900/20" },
];

const FeatureOverviewPage = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet>
          <title>Features Overview | Munal</title>
          <meta name="description" content="Explore all the powerful features Munal offers to streamline your team's collaboration and productivity." />
        </Helmet>
        
        <Header />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative py-20 bg-white dark:bg-slate-900 overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-transparent to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white">
                  Everything Your Team Needs
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  From shift scheduling to AI-powered insights, discover the comprehensive toolkit built to manage your workforce and boost collaboration.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuresList.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link to={feature.link} className="block h-full group">
                      <Card className="h-full border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900 relative overflow-hidden">
                        {feature.badge && (
                          <div className="absolute top-4 right-4">
                            <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-full">
                              {feature.badge}
                            </span>
                          </div>
                        )}
                        <CardContent className="p-8">
                          <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
                            <feature.icon className={`w-7 h-7 ${feature.color}`} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            {feature.desc}
                          </p>
                          <div className="flex items-center text-sm font-medium text-violet-600 dark:text-violet-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                            Learn more <ArrowRight className="w-4 h-4 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default FeatureOverviewPage;
