import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Download, Mail, ArrowRight, ExternalLink,
  Award, TrendingUp, Globe, Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const pressReleases = [
  { date: 'Mar 15, 2026', title: 'Munal Expands AI Meeting Intelligence to Government and Healthcare Sectors', excerpt: 'New compliance-ready features help public agencies and healthcare organizations digitize meeting documentation at scale.' },
  { date: 'Feb 28, 2026', title: 'Munal Launches RBAC Module Permissions for Enterprise Organizations', excerpt: 'Granular role-based access control with audit logging gives IT admins complete visibility and control over platform access.' },
  { date: 'Feb 10, 2026', title: 'Munal Surpasses 500 Organizations on Its Workforce Management Platform', excerpt: 'Rapid adoption across 10 industries validates the demand for AI-powered meeting transcription and team collaboration tools.' },
  { date: 'Jan 22, 2026', title: 'Munal Raises Series B to Expand AI Capabilities and Global Reach', excerpt: 'Leading venture firm backs Munal\u2019s mission to automate meeting intelligence for every team and industry worldwide.' },
  { date: 'Jan 5, 2026', title: 'Munal Introduces eSignature and Document Conversion Features', excerpt: 'New document workflow tools let teams sign PDFs, convert files, and manage approvals without leaving the platform.' },
  { date: 'Dec 12, 2025', title: 'Munal Named in Top 10 AI Productivity Tools by TechReview', excerpt: 'Independent analyst review places Munal alongside industry leaders for meeting intelligence and workforce management innovation.' },
];

const coverage = [
  { outlet: 'TechCrunch', title: 'Munal is building the operating system for meeting-heavy workforces', link: '#' },
  { outlet: 'Forbes', title: 'How AI transcription is eliminating 2 hours of daily paperwork in healthcare', link: '#' },
  { outlet: 'The Verge', title: 'This startup wants to make every government meeting searchable by citizens', link: '#' },
  { outlet: 'VentureBeat', title: 'Munal\u2019s Series B signals strong demand for AI compliance automation', link: '#' },
];

const Press = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>Press & Media - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="press-page">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">Press</span>
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
                    Press & Media
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    Munal in the
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> News</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Press releases, media coverage, and brand resources. For press inquiries, reach our communications team.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25" data-testid="press-hero-cta">
                      <Download className="w-4 h-4 mr-2" /> Download Media Kit
                    </Button>
                    <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700">
                      <Mail className="w-4 h-4 mr-2" /> press@munal.ai
                    </Button>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  <img
                    src="https://images.pexels.com/photos/6950231/pexels-photo-6950231.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                    alt="Munal press and media"
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
                  { value: '500+', label: 'Organizations' },
                  { value: '10', label: 'Industries served' },
                  { value: '$28M', label: 'Total funding' },
                  { value: '50+', label: 'Team members' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Press Releases */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Press Releases</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-10">Official announcements and company milestones.</p>
                <div className="space-y-4">
                  {pressReleases.map((pr, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }}>
                      <Card className="hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid={`press-release-${idx}`}>
                        <CardContent className="p-6">
                          <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{pr.date}</span>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">{pr.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{pr.excerpt}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Media Coverage */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Media Coverage</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-10">What the press is saying about Munal.</p>
                <div className="grid md:grid-cols-2 gap-6">
                  {coverage.map((item, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                      <a href={item.link} className="block group">
                        <Card className="h-full hover:shadow-xl transition-all border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-200 dark:hover:border-violet-800" data-testid={`coverage-card-${idx}`}>
                          <CardContent className="p-6">
                            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{item.outlet}</span>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mt-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">{item.title}</h3>
                            <div className="flex items-center text-sm text-gray-400 mt-4 group-hover:text-violet-500 transition-colors">
                              Read article <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Brand Assets */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Brand Assets</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-10">Download logos, product screenshots, and executive headshots for use in articles and publications.</p>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { title: 'Logos & Marks', desc: 'SVG and PNG formats in light and dark variants.' },
                    { title: 'Product Screenshots', desc: 'High-resolution screenshots of Munal features.' },
                    { title: 'Executive Photos', desc: 'Headshots and bios for leadership team.' },
                  ].map((asset, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer group">
                        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Download className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white mb-2">{asset.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{asset.desc}</p>
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
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">Press Inquiries</h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
                For interviews, quotes, or additional information about Munal, contact our communications team.
              </p>
              <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg" onClick={() => navigate('/contact')} data-testid="press-cta-contact">
                <Mail className="w-5 h-5 mr-2" /> Contact Press Team
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Press;
