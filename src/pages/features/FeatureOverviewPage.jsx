
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mic, Video, Search, MessageSquare, Users, FileText, 
  BarChart, Calendar, LayoutGrid, Zap, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const featuresList = [
  { icon: Calendar, title: "Meetings", desc: "Schedule, host, and manage meetings seamlessly.", link: "/features/meetings", color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/20" },
  { icon: FileText, title: "Transcriptions", desc: "AI-powered audio-to-text with speaker ID.", link: "/features/transcriptions", color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/20" },
  { icon: Video, title: "Video Conferencing", desc: "HD video calls with screen sharing & recording.", link: "/features/video-conferencing", color: "text-pink-500", bg: "bg-pink-100 dark:bg-pink-900/20" },
  { icon: Search, title: "Smart Search", desc: "Find anything across your meeting history instantly.", link: "/features/search", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/20" },
  { icon: MessageSquare, title: "Chat & Messaging", desc: "Real-time team communication and file sharing.", link: "/features/chat-messaging", color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20" },
  { icon: Users, title: "Teams", desc: "Organize workspaces, roles, and permissions.", link: "/features/teams", color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/20" },
  { icon: FileText, title: "File Management", desc: "Secure cloud storage for all your documents.", link: "/features/file-management", color: "text-cyan-500", bg: "bg-cyan-100 dark:bg-cyan-900/20" },
  { icon: BarChart, title: "Analytics", desc: "Insights into productivity and meeting trends.", link: "/features/analytics", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/20" },
  { icon: Mic, title: "Voice Chat", desc: "Quick drop-in audio channels for spontaneous syncs.", link: "/features/voice-chat", color: "text-teal-500", bg: "bg-teal-100 dark:bg-teal-900/20" },
  { icon: Calendar, title: "Calendar Integration", desc: "Sync with Google, Outlook, and more.", link: "/features/calendar-integration", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20" },
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
                  All Features at a Glance
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Discover the comprehensive toolkit built to empower modern teams to achieve more together.
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
                      <Card className="h-full border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900">
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
