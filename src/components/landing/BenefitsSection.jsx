import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Clock, Users, Zap, Lock, Award, Smile, 
  Calendar, FileText, Video, Search, MessageSquare, 
  Mic, Folder, BarChart, ArrowRight, Building2, Shield,
  ClipboardList, Bell, CreditCard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const benefits = [
  {
    icon: Clock,
    title: "Shift Management",
    desc: "Schedule shifts, track time, and manage clock-in/out across teams.",
    link: "/features/meetings"
  },
  {
    icon: Building2,
    title: "Workspaces",
    desc: "Create team workspaces for organized collaboration and projects.",
    link: "/features/teams"
  },
  {
    icon: MessageSquare,
    title: "Team Messaging",
    desc: "Real-time chat and internal messaging within workspaces.",
    link: "/features/chat-messaging"
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    desc: "Schedule meetings, shifts, and events with AI assistance.",
    link: "/features/calendar-integration"
  },
  {
    icon: FileText,
    title: "AI Transcriptions",
    desc: "AI-powered audio-to-text with smart meeting summaries.",
    link: "/features/transcriptions"
  },
  {
    icon: Shield,
    title: "Admin Portal",
    desc: "Full control with role-based permissions and audit logs.",
    link: "/features/analytics"
  },
  {
    icon: BarChart,
    title: "Analytics & Reports",
    desc: "Deep insights into workforce productivity and trends.",
    link: "/features/analytics"
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    desc: "Flexible subscriptions with team billing and usage tracking.",
    link: "/pricing"
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
            Everything Your Team Needs
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From shift scheduling to AI-powered insights, manage your entire workforce in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link to={benefit.link} className="block h-full group">
                <Card className="h-full border border-violet-100 dark:border-violet-900/20 hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-300 shadow-sm hover:shadow-lg bg-white dark:bg-slate-900 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {benefit.desc}
                    </p>
                    <div className="flex items-center text-sm font-medium text-violet-600 dark:text-violet-400">
                      Learn more <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/features/overview">
             <span className="inline-flex items-center font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                View all features <ArrowRight className="w-4 h-4 ml-2" />
             </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;