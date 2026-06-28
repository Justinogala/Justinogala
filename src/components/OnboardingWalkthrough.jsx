import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BotMessageSquare, Briefcase, Calendar,
  MessageSquare, Clock, ArrowRight, X, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle2, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    title: 'Welcome to Munal',
    subtitle: 'Your AI-powered workforce platform',
    description: 'Let us give you a quick tour of the key features that will transform how your team works together.',
    icon: Rocket,
    gradient: 'from-violet-500 to-indigo-600',
    bgAccent: 'bg-violet-50 dark:bg-violet-950/30',
  },
  {
    title: 'Smart Dashboard',
    subtitle: 'Your command center',
    description: 'Get a real-time overview of your workspaces, meetings, team activity, and pending tasks — all in one place.',
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-cyan-500',
    bgAccent: 'bg-blue-50 dark:bg-blue-950/30',
    path: '/dashboard',
  },
  {
    title: 'AI Chat Assistant',
    subtitle: 'Powered by GPT-5.5',
    description: 'Ask questions, get summaries, draft messages, or analyze documents. Your AI co-pilot is always ready to help.',
    icon: BotMessageSquare,
    gradient: 'from-violet-500 to-purple-600',
    bgAccent: 'bg-purple-50 dark:bg-purple-950/30',
    path: '/ai-chat',
  },
  {
    title: 'Workspaces & Teams',
    subtitle: 'Collaborate seamlessly',
    description: 'Create workspaces for your projects, manage team members, share files, and track shifts all in one hub.',
    icon: Briefcase,
    gradient: 'from-teal-500 to-emerald-500',
    bgAccent: 'bg-teal-50 dark:bg-teal-950/30',
    path: '/workspaces',
  },
  {
    title: 'Calendar & Meetings',
    subtitle: 'Stay organized',
    description: 'Schedule meetings, set reminders, and join video calls. Meetings are automatically transcribed and summarized by AI.',
    icon: Calendar,
    gradient: 'from-indigo-500 to-violet-500',
    bgAccent: 'bg-indigo-50 dark:bg-indigo-950/30',
    path: '/calendar',
  },
  {
    title: 'Messaging & Chat',
    subtitle: 'Real-time communication',
    description: 'Send messages, share files, and stay connected with your team. Threaded conversations keep everything organized.',
    icon: MessageSquare,
    gradient: 'from-pink-500 to-rose-500',
    bgAccent: 'bg-pink-50 dark:bg-pink-950/30',
    path: '/workspace/chat',
  },
  {
    title: 'Shift Management',
    subtitle: 'Track time effortlessly',
    description: 'Clock in/out, request time off, swap shifts, and view detailed reports. Managers get real-time oversight of team hours.',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    bgAccent: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    title: "You're All Set!",
    subtitle: 'Start exploring',
    description: 'You can restart this tour anytime from your Profile settings. Now go ahead and explore everything Munal has to offer!',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-green-500',
    bgAccent: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
];

const OnboardingWalkthrough = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const apiUrl = getApiUrl();

  useEffect(() => {
    if (!user?.id) return;
    const localKey = `munal_onboarding_${user.id}`;
    const localDone = localStorage.getItem(localKey);
    if (localDone === 'done') return;

    const check = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/users/${user.id}/onboarding`);
        if (res.ok) {
          const data = await res.json();
          if (data.onboarding_completed) {
            localStorage.setItem(localKey, 'done');
            return;
          }
        }
      } catch {}
      setVisible(true);
    };
    check();
  }, [user?.id, apiUrl]);

  const complete = async () => {
    if (!user?.id) return;
    localStorage.setItem(`munal_onboarding_${user.id}`, 'done');
    setVisible(false);
    try {
      await fetch(`${apiUrl}/api/users/${user.id}/onboarding`, { method: 'PUT' });
    } catch {}
  };

  const next = () => {
    if (step === STEPS.length - 1) {
      complete();
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };

  const prev = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep(s => s - 1);
  };

  const skip = () => complete();

  const goToFeature = () => {
    const currentStep = STEPS[step];
    if (currentStep.path) {
      complete();
      navigate(currentStep.path);
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" data-testid="onboarding-overlay">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        data-testid="onboarding-modal"
      >
        {/* Skip button */}
        {!isLast && (
          <button
            onClick={skip}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            data-testid="onboarding-skip-btn"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-slate-800">
          <motion.div
            className={cn("h-full bg-gradient-to-r", current.gradient)}
            initial={false}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Content */}
        <div className="px-8 pt-8 pb-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon */}
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-5", current.bgAccent)}>
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", current.gradient)}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Text */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1" data-testid="onboarding-title">
                {current.title}
              </h2>
              <p className={cn("text-sm font-medium mb-3 bg-gradient-to-r bg-clip-text text-transparent", current.gradient)}>
                {current.subtitle}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                {current.description}
              </p>

              {/* Try it button for feature steps */}
              {current.path && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToFeature}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  data-testid="onboarding-try-btn"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Try it now
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex items-center justify-between">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === step
                    ? "w-5 h-2 bg-gradient-to-r " + current.gradient
                    : "w-2 h-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300"
                )}
                data-testid={`onboarding-dot-${i}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prev}
                className="h-9 px-3 text-gray-500"
                data-testid="onboarding-prev-btn"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={next}
              className={cn("h-9 px-5 text-white bg-gradient-to-r shadow-lg", current.gradient)}
              data-testid="onboarding-next-btn"
            >
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
              {isLast && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWalkthrough;
