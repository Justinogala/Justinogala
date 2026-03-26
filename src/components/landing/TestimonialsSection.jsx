import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Product Manager at TechFlow",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    quote: "Munal has completely transformed how our product team operates. The automated summaries save us hours of documentation time every week.",
    rating: 5
  },
  {
    name: "David Chen",
    role: "CTO at StartScale",
    avatar: "https://i.pravatar.cc/150?u=david",
    quote: "The accuracy of the transcription is incredible, even with technical jargon. It's become an indispensable tool for our engineering syncs.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Sales Director at GlobalCorp",
    avatar: "https://i.pravatar.cc/150?u=elena",
    quote: "Being able to search through past client calls instantly has improved our sales follow-up process dramatically. Highly recommended!",
    rating: 5
  },
  {
    name: "Michael Chang",
    role: "Lead Designer at CreativeStudio",
    avatar: "https://i.pravatar.cc/150?u=michael",
    quote: "The interface is beautiful and intuitive. It integrates perfectly with our existing workflow tools. A true game-changer.",
    rating: 5
  },
  {
    name: "Dr. Amara Osei",
    role: "Chief Medical Officer at MedVista",
    avatar: "https://i.pravatar.cc/150?u=amara",
    quote: "Our physicians used to spend hours on post-consultation notes. With Munal, clinical documentation happens in real time. Patient care has never been better.",
    rating: 5
  },
  {
    name: "James Whitfield",
    role: "VP of Engineering at CloudNine",
    avatar: "https://i.pravatar.cc/150?u=james",
    quote: "We replaced three different tools with Munal. Architecture reviews, sprint retros, incident post-mortems \u2014 everything is captured and searchable forever.",
    rating: 5
  },
  {
    name: "Priya Kapoor",
    role: "Head of Compliance at FinEdge Capital",
    avatar: "https://i.pravatar.cc/150?u=priya",
    quote: "Regulatory audits used to be a nightmare. Now every investment committee meeting is transcribed, timestamped, and ready for SEC review within hours.",
    rating: 5
  },
  {
    name: "Thomas Erikson",
    role: "Dean of Faculty at Nordic University",
    avatar: "https://i.pravatar.cc/150?u=thomas",
    quote: "Student accessibility has improved dramatically. Every lecture is now searchable, and our faculty meetings produce actionable minutes automatically.",
    rating: 5
  },
  {
    name: "Maria Gonzalez",
    role: "City Clerk at City of Riverside",
    avatar: "https://i.pravatar.cc/150?u=maria2",
    quote: "We cut our council meeting minutes publication time from two weeks to two days. Citizens love having faster access to government decisions.",
    rating: 5
  },
  {
    name: "Rachel Kim",
    role: "Talent Acquisition Lead at NovaTech",
    avatar: "https://i.pravatar.cc/150?u=rachel",
    quote: "Interview panels are 100% more consistent now. Scorecards are auto-populated, bias is flagged, and our time-to-hire dropped by 35%.",
    rating: 5
  },
  {
    name: "David Park, Esq.",
    role: "Partner at Morrison & Associates LLP",
    avatar: "https://i.pravatar.cc/150?u=davidp",
    quote: "Deposition review that used to take days now takes hours. The search across months of case transcripts is phenomenally accurate.",
    rating: 5
  },
  {
    name: "Amanda Torres",
    role: "Customer Success Director at SaaSly",
    avatar: "https://i.pravatar.cc/150?u=amanda",
    quote: "Churn dropped 28% in our first quarter with Munal. We catch negative sentiment signals now before they become cancellation emails.",
    rating: 5
  }
];

const CARDS_PER_VIEW = { desktop: 3, tablet: 2, mobile: 1 };
const AUTO_SLIDE_INTERVAL = 4000;

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setCardsPerView(CARDS_PER_VIEW.desktop);
      else if (window.innerWidth >= 768) setCardsPerView(CARDS_PER_VIEW.tablet);
      else setCardsPerView(CARDS_PER_VIEW.mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = testimonials.length - cardsPerView;

  const next = useCallback(() => {
    setCurrentIndex(prev => prev >= maxIndex ? 0 : prev + 1);
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex(prev => prev <= 0 ? maxIndex : prev - 1);
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const visibleTestimonials = [];
  for (let i = 0; i < cardsPerView; i++) {
    visibleTestimonials.push(testimonials[(currentIndex + i) % testimonials.length]);
  }

  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-950 overflow-hidden" data-testid="testimonials-section">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
            Loved by Industry Leaders
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See what our users are saying about their experience with Munal.
          </p>
        </div>

        <div
          className="relative max-w-6xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 transition-all"
            aria-label="Previous testimonial"
            data-testid="testimonial-prev"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={next}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 transition-all"
            aria-label="Next testimonial"
            data-testid="testimonial-next"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Cards */}
          <div className="overflow-hidden mx-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`grid gap-6 ${
                  cardsPerView === 3 ? 'grid-cols-3' :
                  cardsPerView === 2 ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {visibleTestimonials.map((testimonial, idx) => (
                  <Card key={`${testimonial.name}-${currentIndex}-${idx}`} className="h-full border-none shadow-lg bg-white dark:bg-slate-900 hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-8 flex flex-col h-full">
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-0.5" />
                        ))}
                      </div>
                      <blockquote className="text-base text-gray-700 dark:text-gray-300 mb-6 flex-grow leading-relaxed">
                        &ldquo;{testimonial.quote}&rdquo;
                      </blockquote>
                      <div className="flex items-center mt-auto">
                        <Avatar className="h-11 w-11 mr-3 border-2 border-violet-100 dark:border-violet-800">
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 font-bold">{testimonial.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white">{testimonial.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-1.5" data-testid="testimonial-dots">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'w-6 bg-violet-600 dark:bg-violet-400'
                    : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-violet-300 dark:hover:bg-violet-600'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
