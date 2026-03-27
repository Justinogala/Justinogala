import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Search, BookOpen, Zap, Shield, Settings,
  Users, CreditCard, ArrowRight, FileText, Code, Terminal,
  Plug, HelpCircle, Rocket
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const categories = [
  { icon: Rocket, title: 'Getting Started', count: 8, desc: 'Set up your account, invite your team, and record your first meeting in under 5 minutes.' },
  { icon: FileText, title: 'AI Transcriptions', count: 12, desc: 'Speaker attribution, SOAP notes, medical terminology, and custom vocabulary.' },
  { icon: Users, title: 'Team Management', count: 6, desc: 'Roles, permissions, workspaces, and organization-level access controls.' },
  { icon: Plug, title: 'Integrations', count: 10, desc: 'Connect with Slack, Google Calendar, Salesforce, HubSpot, Zoom, and more.' },
  { icon: Shield, title: 'Security & Compliance', count: 7, desc: 'RBAC, audit logs, encryption, data residency, and regulatory compliance.' },
  { icon: Settings, title: 'Admin & Configuration', count: 9, desc: 'Organization settings, module permissions, broadcasts, and scheduled exports.' },
  { icon: CreditCard, title: 'Billing & Plans', count: 5, desc: 'Subscription management, invoices, team billing, and plan upgrades.' },
  { icon: HelpCircle, title: 'Troubleshooting', count: 14, desc: 'Common issues, error codes, connectivity problems, and workarounds.' },
];

const popularArticles = [
  { title: 'Quick Start Guide', category: 'Getting Started', readTime: '3 min' },
  { title: 'Connecting Your Calendar', category: 'Integrations', readTime: '2 min' },
  { title: 'Setting Up RBAC Permissions', category: 'Security & Compliance', readTime: '5 min' },
  { title: 'Creating Your First Workspace', category: 'Team Management', readTime: '3 min' },
  { title: 'Configuring AI Transcription Settings', category: 'AI Transcriptions', readTime: '4 min' },
  { title: 'Managing Organization Members', category: 'Admin & Configuration', readTime: '3 min' },
];

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>Documentation - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="docs-page">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">Documentation</span>
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
                    Developer Resources
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    Munal
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> Documentation</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Everything you need to set up, configure, and get the most out of Munal. Guides, tutorials, and reference material for every feature.
                  </p>
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search documentation..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                      data-testid="docs-search"
                    />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  <img
                    src="https://images.pexels.com/photos/270373/pexels-photo-270373.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                    alt="Munal documentation"
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
                  { value: '70+', label: 'Articles' },
                  { value: '8', label: 'Categories' },
                  { value: '15+', label: 'Video tutorials' },
                  { value: 'Weekly', label: 'Updates' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Browse by Category</h2>
                <p className="text-gray-600 dark:text-gray-400">Find guides and tutorials organized by topic.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCategories.map((cat, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }} whileHover={{ y: -5 }}>
                    <Card className="h-full hover:shadow-xl transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid={`doc-category-${idx}`}>
                      <CardContent className="p-8">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-5 group-hover:scale-110 transition-transform">
                          <cat.icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{cat.title}</h3>
                          <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{cat.count}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{cat.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Popular Articles */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Popular Articles</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-10">The most-read guides by Munal users.</p>
                <div className="space-y-3">
                  {popularArticles.map((article, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }}>
                      <div className="flex items-center justify-between p-5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer group" data-testid={`popular-article-${idx}`}>
                        <div className="flex items-center gap-4">
                          <BookOpen className="w-5 h-5 text-violet-500 shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{article.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{article.category}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span>{article.readTime}</span>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
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
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">{"Can\u2019t Find What You Need?"}</h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">Our support team is here to help. Reach out anytime.</p>
              <Link to="/contact" className="inline-flex items-center bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg font-medium rounded-md" data-testid="docs-cta-contact">
                Contact Support
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Documentation;
