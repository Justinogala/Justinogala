import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Mic, Video, Search, MessageSquare, Users, FileText, 
  BarChart, Calendar, Radio, LayoutGrid, Zap, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageTransition from '@/components/PageTransition';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const features = [
  {
    icon: LayoutGrid,
    title: "Project Overview",
    desc: "Get a comprehensive view of all your projects and tasks in one place.",
    benefits: ["Centralized dashboard", "Real-time updates", "Progress tracking"],
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/10"
  },
  {
    icon: Calendar,
    title: "Meetings",
    desc: "Schedule, join, and manage meetings seamlessly with integrated calendar tools.",
    benefits: ["One-click scheduling", "Google Calendar sync", "Automated reminders"],
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/10"
  },
  {
    icon: FileText,
    title: "Transcriptions",
    desc: "Convert your meeting audio into accurate text automatically with AI.",
    benefits: ["99% accuracy", "Speaker identification", "Multi-language support"],
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/10"
  },
  {
    icon: Video,
    title: "Video Conferencing",
    desc: "Host high-quality video calls with screen sharing and recording capabilities.",
    benefits: ["HD video & audio", "Screen sharing", "Recording included"],
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-900/10"
  },
  {
    icon: Search,
    title: "Smart Search",
    desc: "Find any keyword, topic, or speaker across your entire meeting history.",
    benefits: ["Full-text search", "Advanced filters", "Context highlighting"],
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/10"
  },
  {
    icon: MessageSquare,
    title: "Chat & Messaging",
    desc: "Collaborate with your team in real-time through secure messaging channels.",
    benefits: ["Direct messages", "Group channels", "File sharing"],
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/10"
  },
  {
    icon: Users,
    title: "Teams",
    desc: "Organize your workspace by departments, projects, or client groups.",
    benefits: ["Role-based access", "Team workspaces", "Member management"],
    color: "text-cyan-500",
    bg: "bg-cyan-50 dark:bg-cyan-900/10"
  },
  {
    icon: FileText,
    title: "File Management",
    desc: "Store, organize, and share documents securely within your workspace.",
    benefits: ["Cloud storage", "Version control", "Secure sharing"],
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-900/10"
  },
  {
    icon: BarChart,
    title: "Analytics",
    desc: "Gain insights into meeting productivity, attendance, and team engagement.",
    benefits: ["Usage reports", "Productivity metrics", "Trend analysis"],
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/10"
  },
  {
    icon: Mic,
    title: "Voice Chat",
    desc: "Quick voice communication channels for spontaneous team huddles.",
    benefits: ["Drop-in audio", "Push-to-talk", "Low latency"],
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/10"
  }
];

const FeaturesPage = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
        <Helmet>
          <title>Features | Munal - Powerful Tools for Modern Teams</title>
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
                  Powerful Features for Modern Teams
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                  Everything you need to streamline your meetings, capture insights, and collaborate effectively.
                  All in one unified platform.
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
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Ready to boost your productivity?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of teams using Munal to make their meetings more productive and actionable.
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