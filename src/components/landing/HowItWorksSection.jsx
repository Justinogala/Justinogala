import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, MessageSquare, Video, FileCheck, BarChart3,
  ArrowRight, Users, PenTool, Shield, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: Briefcase,
    accent: Users,
    title: "Set Up Your Space",
    desc: "Create your account and workspace in seconds. Invite your team, assign roles, and customize your environment.",
    gradient: "from-indigo-500 to-violet-600",
    shadow: "shadow-indigo-500/25",
    highlights: ["Instant workspace creation", "Custom roles & permissions"],
  },
  {
    icon: MessageSquare,
    accent: Zap,
    title: "Connect & Collaborate",
    desc: "Real-time chat with file sharing, voice calls, and rich presence statuses — all in one unified platform.",
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/25",
    highlights: ["Real-time messaging", "Voice & video calls"],
  },
  {
    icon: Video,
    accent: Shield,
    title: "Run Smart Meetings",
    desc: "Schedule, join, and record meetings with AI-powered transcription and summaries — automatically.",
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/25",
    highlights: ["AI transcription", "Auto meeting summaries"],
  },
  {
    icon: FileCheck,
    accent: PenTool,
    title: "Streamline Workflows",
    desc: "Digital forms, eSignatures, approvals, and ICT support — eliminate paper and reduce turnaround time.",
    gradient: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-500/25",
    highlights: ["eSignatures & approvals", "ICT support tracking"],
  },
  {
    icon: BarChart3,
    accent: Zap,
    title: "Track & Grow",
    desc: "Live dashboards with activity graphs, real-time insights, and team metrics to keep everyone aligned.",
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/25",
    highlights: ["Live activity dashboard", "Real-time team analytics"],
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 sm:py-32 bg-gray-50 dark:bg-slate-950 relative overflow-hidden" data-testid="how-it-works-section">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent dark:from-indigo-950/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-100/30 via-transparent to-transparent dark:from-violet-950/10 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-5">
            Simple to start
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 text-gray-900 dark:text-white tracking-tight">
            How Munal AI Works
          </h2>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From setup to insights in five steps. No complicated onboarding — just sign up and your team is ready to go.
          </p>
        </motion.div>

        {/* Steps - Desktop: timeline layout, Mobile: stacked cards */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-violet-300 to-purple-200 dark:from-indigo-800 dark:via-violet-700 dark:to-purple-800 -translate-x-1/2" />

          <div className="space-y-8 lg:space-y-0">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="lg:relative lg:mb-16 last:lg:mb-0"
                  data-testid={`how-it-works-step-${idx + 1}`}
                >
                  {/* Timeline dot (desktop) */}
                  <div className="hidden lg:flex absolute left-1/2 top-8 -translate-x-1/2 z-20">
                    <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-lg ring-4 ring-white dark:ring-slate-950", step.gradient, step.shadow)}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Card - alternating left/right on desktop */}
                  <div className={cn(
                    "lg:w-[calc(50%-40px)]",
                    isEven ? "lg:ml-0 lg:mr-auto lg:pr-4" : "lg:ml-auto lg:mr-0 lg:pl-4"
                  )}>
                    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500">
                      {/* Hover glow */}
                      <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500", step.gradient)} />

                      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
                        {/* Icon + step number (mobile) */}
                        <div className="flex items-center gap-4">
                          <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300", step.gradient, step.shadow)}>
                            <step.icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="lg:hidden text-sm font-bold text-gray-300 dark:text-gray-600">Step {idx + 1}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                            {step.desc}
                          </p>

                          {/* Feature highlights */}
                          <div className="flex flex-wrap gap-2">
                            {step.highlights.map((h, hi) => (
                              <span
                                key={hi}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-slate-800 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700"
                              >
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16 sm:mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Ready to transform how your team works?</p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300"
            data-testid="how-it-works-cta"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
