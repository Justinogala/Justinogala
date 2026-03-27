import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, BookOpen, Code, FileText, MessageSquare,
  ArrowRight, Users, Headphones, Video, GraduationCap,
  Download, Lightbulb
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const primaryResources = [
  { icon: BookOpen, title: 'Documentation', desc: 'Step-by-step guides, setup tutorials, and configuration details for every Munal feature.', link: '/resources/docs', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { icon: Code, title: 'API Reference', desc: 'REST API endpoints, SDKs, authentication, and code examples for building custom integrations.', link: '/resources/api', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: FileText, title: 'Blog & Insights', desc: 'Deep dives into AI, modern ICT, workforce management, and the technologies shaping how teams work.', link: '/resources/blog', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: MessageSquare, title: 'Community', desc: 'Join 2,000+ professionals sharing workflows, tips, and best practices across Slack, GitHub, and forums.', link: '/resources/community', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
];

const additionalResources = [
  { icon: Video, title: 'Video Tutorials', desc: '15+ video walkthroughs covering setup, features, and advanced workflows.', tag: 'Popular' },
  { icon: GraduationCap, title: 'Munal Academy', desc: 'Free certification courses for admins, power users, and developers.' },
  { icon: Headphones, title: 'Support Center', desc: '24/7 help desk with ticketing, live chat, and a searchable knowledge base.', link: '/support' },
  { icon: Download, title: 'Downloadable Templates', desc: 'Meeting agenda templates, shift schedules, compliance checklists, and more.' },
  { icon: Users, title: 'Partner Directory', desc: 'Find certified Munal implementation partners and consultants in your region.' },
  { icon: Lightbulb, title: 'Feature Requests', desc: 'Vote on upcoming features, submit ideas, and see what the team is building next.' },
];

const ResourcesIndex = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>Resources - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="resources-page">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">Resources</span>
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
                    Learn, Build & Connect
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    Everything You Need to
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> Succeed</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Docs, APIs, tutorials, community, and expert support — all the resources to help your team get the most out of Munal.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25" onClick={() => navigate('/resources/docs')} data-testid="resources-hero-cta">
                      Browse Documentation
                    </Button>
                    <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700" onClick={() => navigate('/resources/community')}>
                      Join Community
                    </Button>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  <img
                    src="https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                    alt="Munal resources and learning"
                    className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="py-10 bg-gradient-to-r from-violet-600 to-purple-700 text-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: '70+', label: 'Documentation articles' },
                  { value: '15+', label: 'Video tutorials' },
                  { value: '2,000+', label: 'Community members' },
                  { value: '24/7', label: 'Expert support' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Primary Resources */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Core Resources</h2>
                <p className="text-gray-600 dark:text-gray-400">Start here. The essentials for every Munal user and developer.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {primaryResources.map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                    <Link to={item.link} data-testid={`resource-card-${idx}`}>
                      <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <CardContent className="p-8 flex items-start gap-6">
                          <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} shrink-0 group-hover:scale-110 transition-transform`}>
                            <item.icon className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{item.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{item.desc}</p>
                            <span className="inline-flex items-center text-sm font-medium text-violet-600 dark:text-violet-400 group-hover:gap-2 transition-all">
                              Explore <ArrowRight className="w-4 h-4 ml-1" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Additional Resources */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">More Resources</h2>
                <p className="text-gray-600 dark:text-gray-400">Tutorials, templates, partners, and everything in between.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {additionalResources.map((item, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }} whileHover={{ y: -5 }}>
                    <Card className="h-full hover:shadow-xl transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden" data-testid={`additional-resource-${idx}`}>
                      {item.tag && (
                        <div className="absolute top-4 right-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full">{item.tag}</span>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{item.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">Need Help Getting Started?</h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">Our team is available 24/7 to help you set up, configure, and get the most out of Munal.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg" onClick={() => navigate('/contact')} data-testid="resources-cta-contact">
                  Contact Support
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10 px-8 h-12 text-lg" onClick={() => navigate('/signup')}>
                  Start Free Trial
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default ResourcesIndex;
