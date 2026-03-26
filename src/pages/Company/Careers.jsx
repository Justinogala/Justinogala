import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Briefcase, Clock, ArrowRight, Heart, Zap, Globe, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const positions = [
  { title: 'Senior Frontend Engineer', dept: 'Engineering', loc: 'Remote', type: 'Full-time' },
  { title: 'AI Research Scientist', dept: 'Data Science', loc: 'New York / Remote', type: 'Full-time' },
  { title: 'Product Designer', dept: 'Design', loc: 'Remote', type: 'Full-time' },
  { title: 'Account Executive', dept: 'Sales', loc: 'San Francisco', type: 'Full-time' },
  { title: 'DevOps Engineer', dept: 'Engineering', loc: 'Remote', type: 'Full-time' },
  { title: 'Customer Success Manager', dept: 'Customer Success', loc: 'Toronto / Remote', type: 'Full-time' },
];

const perks = [
  { icon: Globe, title: 'Remote-First', desc: 'Work from anywhere in the world. We trust our people to deliver, not clock in.' },
  { icon: Heart, title: 'Health & Wellness', desc: 'Comprehensive health, dental, and vision plans. Plus mental health support.' },
  { icon: Zap, title: 'Growth Budget', desc: '$2,000/year for learning, conferences, books, and courses of your choice.' },
  { icon: Coffee, title: 'Flexible PTO', desc: 'Unlimited vacation policy. We believe rest fuels the best work.' },
];

const Careers = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>Careers - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="careers-page">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">Careers</span>
              </nav>
            </div>
          </div>

          {/* Hero */}
          <section className="relative py-20 lg:py-28 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
                    {"We\u2019re Hiring"}
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    Build the Future of
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> Work with Us</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Join a passionate team redefining how organizations capture knowledge, collaborate, and make decisions. Remote-first, impact-driven.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25" onClick={() => document.getElementById('open-positions').scrollIntoView({ behavior: 'smooth' })} data-testid="careers-hero-cta">
                      View Open Roles
                    </Button>
                    <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700" onClick={() => navigate('/about')}>
                      About Munal
                    </Button>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  <img
                    src="https://images.pexels.com/photos/7654119/pexels-photo-7654119.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                    alt="Munal team collaborating"
                    className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="py-10 bg-gradient-to-r from-violet-600 to-purple-700 text-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: '50+', label: 'Team members' },
                  { value: '12', label: 'Countries represented' },
                  { value: '95%', label: 'Remote workforce' },
                  { value: '4.8', label: 'Glassdoor rating' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Perks */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Why Join Munal?</h2>
                <p className="text-gray-600 dark:text-gray-400">We invest in our people so they can do their best work.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {perks.map((perk, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 h-full text-center">
                      <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mx-auto mb-4">
                        <perk.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-base mb-2 text-gray-900 dark:text-white">{perk.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{perk.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Open Positions */}
          <section id="open-positions" className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Open Positions</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-10">Find your next role at Munal. All positions are open to remote candidates.</p>
                <div className="space-y-4">
                  {positions.map((job, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                      <Card className="hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid={`job-card-${i}`}>
                        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{job.title}</h3>
                            <div className="flex flex-wrap gap-3 mt-2">
                              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400"><Briefcase className="w-3.5 h-3.5 mr-1.5" />{job.dept}</span>
                              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400"><MapPin className="w-3.5 h-3.5 mr-1.5" />{job.loc}</span>
                              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400"><Clock className="w-3.5 h-3.5 mr-1.5" />{job.type}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 shrink-0">
                            Apply <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
                {"Don\u2019t See the Right Role?"}
              </h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
                {"We\u2019re always looking for exceptional talent. Send us your resume and we\u2019ll be in touch when the perfect role opens up."}
              </p>
              <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg" onClick={() => navigate('/contact')} data-testid="careers-cta-contact">
                Get in Touch
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Careers;
