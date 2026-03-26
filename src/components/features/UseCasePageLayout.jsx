import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, CheckCircle2, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { cn } from '@/lib/utils';

const UseCasePageLayout = ({
  industry,
  tagline,
  title,
  description,
  heroImage,
  accentColor = 'violet',
  stats = [],
  socialProof,
  challenges = [],
  solutions = [],
  workflows = [],
  testimonial,
  prevCase,
  nextCase,
}) => {
  const navigate = useNavigate();

  const colorMap = {
    violet: { bg: 'from-violet-600 to-purple-700', light: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', ring: 'ring-violet-500/20', badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
    emerald: { bg: 'from-emerald-600 to-teal-700', light: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-500/20', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    blue: { bg: 'from-blue-600 to-indigo-700', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', ring: 'ring-blue-500/20', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    amber: { bg: 'from-amber-600 to-orange-700', light: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', ring: 'ring-amber-500/20', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    slate: { bg: 'from-slate-700 to-gray-800', light: 'bg-slate-50 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', ring: 'ring-slate-500/20', badge: 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300' },
  };

  const colors = colorMap[accentColor] || colorMap.violet;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet>
          <title>{industry} - Munal | AI Meeting Companion</title>
          <meta name="description" content={description} />
        </Helmet>

        <Header />

        <main className="flex-grow" data-testid={`usecase-${industry.toLowerCase().replace(/\s+/g, '-')}`}>
          {/* Breadcrumbs */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <Link to="/use-cases" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Use Cases</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">{industry}</span>
              </nav>
            </div>
          </div>

          {/* Hero */}
          <section className="relative py-20 lg:py-28 overflow-hidden bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                  <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6", colors.badge)}>
                    {tagline}
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    {title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25" data-testid="usecase-hero-cta">
                      Start Free Trial
                    </Button>
                    <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700" onClick={() => navigate('/contact')}>
                      Talk to Sales
                    </Button>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className={cn("absolute inset-0 bg-gradient-to-tr rounded-2xl blur-3xl -z-10", colors.bg, "opacity-20")} />
                  <img src={heroImage} alt={industry} className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Stats Bar */}
          {stats.length > 0 && (
            <section className={cn("py-10 bg-gradient-to-r text-white", colors.bg)}>
              <div className="container mx-auto px-6">
                {socialProof && (
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-6">
                    <p className="text-sm font-medium opacity-80 tracking-wide" data-testid="social-proof">{socialProof}</p>
                  </motion.div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  {stats.map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                      <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm opacity-80">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Challenges → Solutions */}
          {challenges.length > 0 && (
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
                    Challenges in {industry}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Common pain points Munal solves for {industry.toLowerCase()} professionals.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {challenges.map((item, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                      <Card className="h-full border-none shadow-md hover:shadow-xl transition-all bg-white dark:bg-slate-900">
                        <CardContent className="p-8">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-6", colors.light, colors.text)}>
                            <item.icon className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{item.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Solutions / How Munal Helps */}
          {solutions.length > 0 && (
            <section className="py-20 bg-white dark:bg-slate-900">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">How Munal Helps</h2>
                  <p className="text-gray-600 dark:text-gray-400">Purpose-built features for {industry.toLowerCase()} workflows.</p>
                </div>
                <div className="space-y-12">
                  {solutions.map((sol, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                      className={cn("flex flex-col lg:flex-row gap-10 items-center", idx % 2 !== 0 && "lg:flex-row-reverse")}
                    >
                      <div className="flex-1">
                        <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-4", colors.badge)}>
                          Step {idx + 1}
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{sol.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{sol.description}</p>
                        {sol.bullets && (
                          <ul className="space-y-3">
                            {sol.bullets.map((b, bi) => (
                              <li key={bi} className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 text-sm">{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex-1 w-full">
                        <div className={cn("rounded-2xl p-8 min-h-[220px] flex items-center justify-center", colors.light)}>
                          <div className={cn("w-20 h-20 rounded-full flex items-center justify-center", "bg-white dark:bg-slate-800 shadow-lg")}>
                            {sol.icon && <sol.icon className={cn("w-10 h-10", colors.text)} />}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Workflow Cards */}
          {workflows.length > 0 && (
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
              <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold font-heading mb-12 text-center text-gray-900 dark:text-white">
                  Built for {industry} Workflows
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {workflows.map((wf, idx) => (
                    <motion.div key={idx} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 h-full">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", colors.light, colors.text)}>
                          <wf.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-base mb-2 text-gray-900 dark:text-white">{wf.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{wf.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Testimonial */}
          {testimonial && (
            <section className="py-20 bg-white dark:bg-slate-900">
              <div className="container mx-auto px-6 max-w-4xl">
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="relative text-center">
                  <Quote className={cn("w-12 h-12 mx-auto mb-6 opacity-30", colors.text)} />
                  <blockquote className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 leading-relaxed mb-8 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {/* CTA */}
          <section className={cn("py-20 bg-gradient-to-r text-white relative overflow-hidden", colors.bg)}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
                Transform Your {industry} Workflows
              </h2>
              <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
                Join leading {industry.toLowerCase()} organizations using Munal to save time, improve accuracy, and drive better outcomes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg" onClick={() => navigate('/signup')} data-testid="usecase-cta-bottom">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10 px-8 h-12 text-lg" onClick={() => navigate('/pricing')}>
                  View Pricing
                </Button>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <section className="py-12 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6">
              <div className="flex justify-between items-center">
                {prevCase ? (
                  <Link to={prevCase.link} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Previous</div>
                      <div className="font-medium">{prevCase.name}</div>
                    </div>
                  </Link>
                ) : <div />}
                {nextCase ? (
                  <Link to={nextCase.link} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group text-right">
                    <div>
                      <div className="text-xs text-gray-400">Next</div>
                      <div className="font-medium">{nextCase.name}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : <div />}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default UseCasePageLayout;
