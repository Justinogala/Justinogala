import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, PlayCircle, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import DemoVideoModal from '@/components/DemoVideoModal';
import { useHeroSlide } from '@/contexts/HeroSlideContext';

const BenefitsSection = lazy(() => import('@/components/landing/BenefitsSection'));
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection'));
const PricingSection = lazy(() => import('@/components/landing/PricingSection'));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection'));
const StatsSection = lazy(() => import('@/components/landing/StatsSection'));

const SLIDES = [
  {
    headline: <>Manage, Collaborate, <br className="hidden md:block" />and <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Scale Your Team</span></>,
    description: "The all-in-one AI-powered unified communication and workforce platform designed to replace multiple workplace tools with a single integrated system.",
    cta: "Get Started Free",
    ctaLink: "/signup",
    image: "https://static.prod-images.emergentagent.com/jobs/f7ee836a-0271-464d-a8fb-de0d209aae53/images/76ec4552dbe7b1bbce8af176b036f49b3a1aaec319d9640841d0367f7e808bc2.png",
    bg: "from-slate-50 via-emerald-50/40 to-lime-50/30",
    bloom1: "from-emerald-300/40 via-teal-200/30",
    bloom2: "from-violet-200/20 via-slate-100/10",
    bloom3: "from-lime-200/25 via-emerald-100/15",
    lineColor1: "#059669",
    lineColor2: "#a3e635",
  },
  {
    headline: <>Streamline Every <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Workflow</span> Effortlessly</>,
    description: "Digital forms, eSignatures, approvals, and ICT support — eliminate paperwork and reduce turnaround time with intelligent automation.",
    cta: "Explore Workflows",
    ctaLink: "/signup",
    image: "https://static.prod-images.emergentagent.com/jobs/f7ee836a-0271-464d-a8fb-de0d209aae53/images/54adb864712e25da3c0a319e51dd8f02f2d9705fd01a1778eabb75ed18d84076.png",
    bg: "from-orange-50/40 via-amber-50/30 to-slate-50",
    bloom1: "from-amber-300/40 via-orange-200/30",
    bloom2: "from-rose-200/15 via-slate-100/10",
    bloom3: "from-yellow-200/25 via-amber-100/15",
    lineColor1: "#d97706",
    lineColor2: "#fbbf24",
  },
  {
    headline: <>AI-Powered <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">Meeting Intelligence</span></>,
    description: "Record, transcribe, and summarize meetings automatically. Turn conversations into searchable knowledge with smart AI assistance.",
    cta: "Try AI Meetings",
    ctaLink: "/signup",
    image: "https://static.prod-images.emergentagent.com/jobs/f7ee836a-0271-464d-a8fb-de0d209aae53/images/3b9781b6ce48e3dd4e0aa40371f9a53050d3656b1ddedad6766825a568b6f563.png",
    bg: "from-violet-50/40 via-indigo-50/30 to-slate-50",
    bloom1: "from-violet-300/40 via-indigo-200/30",
    bloom2: "from-blue-200/15 via-slate-100/10",
    bloom3: "from-purple-200/25 via-violet-100/15",
    lineColor1: "#7c3aed",
    lineColor2: "#a78bfa",
  },
];

const INTERVAL = 6000;

const HeroCarousel = ({ onDemoOpen }) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const { setSlideIndex } = useHeroSlide();

  const goTo = useCallback((idx) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(prev => (prev + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next]);

  // Sync slide index to context for banner color
  useEffect(() => {
    setSlideIndex(current);
  }, [current, setSlideIndex]);

  const slide = SLIDES[current];

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 150 : -150, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -150 : 150, opacity: 0 }),
  };

  return (
    <section className="relative min-h-[auto] sm:min-h-[78vh] flex items-center overflow-hidden" data-testid="hero-carousel">
      {/* Animated background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br", slide.bg)} />
          <div className={cn("absolute -bottom-32 -left-32 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-gradient-to-tr to-transparent blur-3xl pointer-events-none", slide.bloom1)} />
          <div className={cn("absolute -top-20 left-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] rounded-full bg-gradient-to-b to-transparent blur-3xl pointer-events-none", slide.bloom2)} />
          <div className={cn("absolute top-1/3 -right-20 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full bg-gradient-to-bl to-transparent blur-3xl pointer-events-none", slide.bloom3)} />
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block" preserveAspectRatio="none" viewBox="0 0 1920 900">
            <defs>
              <linearGradient id={`line-${current}`} x1="0.6" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor={slide.lineColor1} stopOpacity="0.5" />
                <stop offset="100%" stopColor={slide.lineColor2} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <line x1="1200" y1="0" x2="1500" y2="900" stroke={`url(#line-${current})`} strokeWidth="2" />
          </svg>
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container mx-auto px-5 sm:px-6 relative z-10 pt-2 pb-8 sm:pb-8">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-2 sm:gap-8 lg:gap-16">
          {/* Left - Text */}
          <div className="flex-1 text-left">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`text-${current}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-2 sm:mb-6">
                  {slide.headline}
                </h1>
                <p className="text-base sm:text-xl text-gray-500 mb-3 sm:mb-8 max-w-xl leading-relaxed">
                  {slide.description}
                </p>
                <div className="flex flex-row items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => navigate(slide.ctaLink)}
                    className="h-11 sm:h-12 px-5 sm:px-7 text-sm sm:text-base bg-gray-900 hover:bg-gray-800 text-white rounded-lg shadow-lg transition-all hover:scale-105"
                  >
                    {slide.cta} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    data-testid="watch-demo-btn"
                    onClick={onDemoOpen}
                    className="h-11 sm:h-12 px-5 sm:px-7 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg"
                  >
                    <PlayCircle className="mr-2 w-5 h-5" /> Watch Demo
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right - Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.img
                key={`img-${current}`}
                src={slide.image}
                alt="Platform illustration"
                custom={direction}
                variants={{
                  enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.9 }),
                  center: { x: 0, opacity: 1, scale: 1 },
                  exit: (dir) => ({ x: dir > 0 ? -100 : 100, opacity: 0, scale: 0.9 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-full sm:max-w-xs lg:max-w-sm xl:max-w-md h-auto object-contain mix-blend-multiply opacity-90"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation controls - bottom center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4" data-testid="hero-nav">
        {/* Pause/Play */}
        <button
          onClick={() => setPaused(!paused)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300/60 text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors bg-white/50 backdrop-blur-sm"
          aria-label={paused ? "Play" : "Pause"}
          data-testid="hero-pause-btn"
        >
          {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Prev */}
        <button
          onClick={prev}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300/60 text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors bg-white/50 backdrop-blur-sm"
          aria-label="Previous slide"
          data-testid="hero-prev-btn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "w-6 h-2.5 bg-gray-900"
                  : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-500"
              )}
              aria-label={`Go to slide ${i + 1}`}
              data-testid={`hero-dot-${i}`}
            />
          ))}
        </div>

        {/* Next */}
        <button
          onClick={next}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300/60 text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors bg-white/50 backdrop-blur-sm"
          aria-label="Next slide"
          data-testid="hero-next-btn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col overflow-x-hidden">
        <Helmet>
          <title>Munal - AI-Powered Workforce & Collaboration Platform</title>
        </Helmet>

        <Header />

        <main className="flex-grow">
          <HeroCarousel onDemoOpen={() => setDemoOpen(true)} />

          <Suspense fallback={null}>
            <StatsSection />
          </Suspense>

          <div id="features">
            <Suspense fallback={null}>
              <BenefitsSection />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <HowItWorksSection />
          </Suspense>

          <Suspense fallback={null}>
            <TestimonialsSection />
          </Suspense>

          <Suspense fallback={null}>
            <PricingSection />
          </Suspense>

          {/* Final CTA */}
          <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-900/50 to-purple-900/50" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">Start Your Free Trial Today</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                No credit card required. Cancel anytime. Join the productivity revolution.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                className="h-14 px-10 text-lg bg-white text-slate-900 hover:bg-gray-100 rounded-full shadow-xl transition-all hover:scale-105"
              >
                Get Started Now
              </Button>
            </div>
          </section>
        </main>

        <Footer />
        <DemoVideoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
      </div>
    </PageTransition>
  );
};

export default LandingPage;
