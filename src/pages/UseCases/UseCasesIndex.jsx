import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, Code, Heart, Briefcase, HeartPulse,
  GraduationCap, Landmark, Scale, Wallet, ArrowRight, LayoutGrid
} from 'lucide-react';

const CaseCard = ({ item, idx }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: idx * 0.08 }}
  >
    <Link to={item.link} data-testid={`usecase-card-${item.title.toLowerCase().replace(/[\s&]+/g, '-')}`}>
      <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-8">
          <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center ${item.color} mb-6 group-hover:scale-110 transition-transform`}>
            <item.icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">{item.desc}</p>
          <div className="flex items-center text-violet-600 dark:text-violet-400 font-medium text-sm group-hover:gap-2 transition-all">
            Learn more <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

const UseCasesIndex = () => {
  const navigate = useNavigate();

  const teamCases = [
    { title: 'Sales Teams', icon: TrendingUp, desc: 'Close more deals with automated CRM entry and AI coaching.', link: '/use-cases/sales', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { title: 'Customer Success', icon: Heart, desc: 'Track sentiment and ensure no customer request is lost.', link: '/use-cases/customer-success', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { title: 'Product Teams', icon: LayoutGrid, desc: 'Turn user feedback into roadmap features instantly.', link: '/use-cases/product', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { title: 'Engineering', icon: Code, desc: 'Capture technical requirements and architectural decisions.', link: '/use-cases/engineering', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { title: 'HR & Recruiting', icon: Briefcase, desc: 'Focus on the candidate, not note-taking during interviews.', link: '/use-cases/hr', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  ];

  const industryCases = [
    { title: 'Healthcare', icon: HeartPulse, desc: 'HIPAA-ready clinical documentation and telehealth intelligence.', link: '/use-cases/healthcare', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Education', icon: GraduationCap, desc: 'Lecture transcription, faculty meeting docs, and accessible learning.', link: '/use-cases/education', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Government', icon: Landmark, desc: 'Transparent meeting records, FOIA compliance, and citizen access.', link: '/use-cases/government', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/40' },
    { title: 'Legal & Compliance', icon: Scale, desc: 'Deposition transcription, case research, and privilege-aware access.', link: '/use-cases/legal', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Finance', icon: Wallet, desc: 'Regulatory compliance records, investment committee intelligence.', link: '/use-cases/finance', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>Use Cases - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="usecases-index">
          {/* Hero */}
          <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-24 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-transparent to-purple-50/40 dark:from-violet-900/10 dark:to-purple-900/10 pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
                  Solutions for Every Team
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight max-w-4xl mx-auto">
                  Built for How Your
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> Team Works</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Discover how Munal transforms workflows across teams and industries with AI-powered meeting intelligence.
                </p>
              </motion.div>
            </div>
          </section>

          {/* By Team */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 dark:text-white mb-3">By Team</h2>
                <p className="text-gray-600 dark:text-gray-400">Tailored solutions for every department in your organization.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamCases.map((item, i) => <CaseCard key={item.title} item={item} idx={i} />)}
              </div>
            </div>
          </section>

          {/* By Industry */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-6">
              <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 dark:text-white mb-3">By Industry</h2>
                <p className="text-gray-600 dark:text-gray-400">Industry-specific compliance, workflows, and integrations.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {industryCases.map((item, i) => <CaseCard key={item.title} item={item} idx={i} />)}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
                {"Don\u2019t See Your Use Case?"}
              </h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
                Munal adapts to any meeting-heavy workflow. Talk to our team to explore custom solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg" onClick={() => navigate('/signup')} data-testid="usecases-cta-signup">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10 px-8 h-12 text-lg" onClick={() => navigate('/contact')}>
                  Contact Sales
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

export default UseCasesIndex;
