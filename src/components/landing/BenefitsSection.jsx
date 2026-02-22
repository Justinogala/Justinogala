import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Clock, Users, Zap, Lock, Award, Smile, 
  Calendar, FileText, Video, Search, MessageSquare, 
  Mic, Folder, BarChart, ArrowRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const benefits = [
  {
    icon: Calendar,
    title: "Meetings",
    desc: "Schedule and manage meetings effortlessly.",
    link: "/features/meetings"
  },
  {
    icon: FileText,
    title: "Transcriptions",
    desc: "AI-powered audio-to-text with 99% accuracy.",
    link: "/features/transcriptions"
  },
  {
    icon: Video,
    title: "Video Conferencing",
    desc: "Crystal clear HD video calls for teams.",
    link: "/features/video-conferencing"
  },
  {
    icon: Search,
    title: "Smart Search",
    desc: "Find anything spoken or written instantly.",
    link: "/features/search"
  },
  {
    icon: MessageSquare,
    title: "Chat & Messaging",
    desc: "Seamless team communication channels.",
    link: "/features/chat-messaging"
  },
  {
    icon: Mic,
    title: "Voice Chat",
    desc: "Drop-in audio for quick team syncs.",
    link: "/features/voice-chat"
  },
  {
    icon: Folder,
    title: "File Management",
    desc: "Secure cloud storage for your docs.",
    link: "/features/file-management"
  },
  {
    icon: BarChart,
    title: "Analytics",
    desc: "Deep insights into team productivity.",
    link: "/features/analytics"
  }
];

const BenefitsSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything your team needs to collaborate, capture, and create.
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