
import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Calendar, Video, FileText } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "Create Account",
    desc: "Sign up in seconds and set up your personal or team workspace."
  },
  {
    icon: Calendar,
    title: "Schedule Meeting",
    desc: "Connect your calendar or schedule a new meeting directly in Munal."
  },
  {
    icon: Video,
    title: "Join Meeting",
    desc: "Launch your video call. Munal automatically joins to record and transcribe."
  },
  {
    icon: FileText,
    title: "Get Transcription",
    desc: "Receive accurate transcripts and AI summaries instantly after the call."
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/40 via-transparent to-transparent dark:from-violet-900/10 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get started with Munal in four simple steps. No complicated setup required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="relative"
            >
              {/* Connector Line (Desktop) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-violet-200 dark:bg-violet-800 -z-10" />
              )}
              
              <div className="flex flex-col items-center text-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 h-full relative z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-500/30">
                  <step.icon className="w-7 h-7" />
                </div>
                
                <div className="absolute top-4 right-4 text-xs font-bold text-violet-200 dark:text-violet-900/50 text-opacity-50 text-[40px] leading-none pointer-events-none select-none">
                  {idx + 1}
                </div>

                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
