
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Video, FileText, Clock } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: "10K+",
    label: "Active Users"
  },
  {
    icon: Video,
    value: "50K+",
    label: "Meetings Hosted"
  },
  {
    icon: FileText,
    value: "1M+",
    label: "Transcriptions Generated"
  },
  {
    icon: Clock,
    value: "500K+",
    label: "Hours Saved"
  }
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-4"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{stat.value}</div>
              <div className="text-violet-100 font-medium text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
