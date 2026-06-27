import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Award, ExternalLink, Shield, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const LEVEL_COLORS = {
  foundational: 'bg-green-100 text-green-700 border-green-200',
  beginner: 'bg-blue-100 text-blue-700 border-blue-200',
  associate: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
  advanced: 'bg-red-100 text-red-700 border-red-200',
};

const CertificationPathways = () => {
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/academy/certification-pathways`)
      .then(r => r.ok ? r.json() : { pathways: [] })
      .then(d => setPathways(d.pathways || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Certification Pathways | Munal AI Academy</title></Helmet>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-4 border border-white/10">
            <Award className="w-4 h-4 text-emerald-300" />
            <span className="text-sm text-emerald-200">Industry Certifications</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Certification Pathways</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Prepare for industry-recognized certifications with our curated courses. Each pathway maps Munal AI Academy courses to real certification exam topics.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10" data-testid="certification-pathways-page">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : pathways.length === 0 ? (
          <div className="text-center py-20">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No certification pathways available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pathways.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/5 transition-all group" data-testid={`cert-${p.id}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{p.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">by {p.provider}</p>
                    </div>
                    <Shield className="w-8 h-8 text-emerald-500 shrink-0 opacity-60" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <Badge className={cn("text-[10px] capitalize border", LEVEL_COLORS[p.level] || LEVEL_COLORS.beginner)}>
                      {p.level}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-gray-500">{p.cost}</Badge>
                    {(p.prep_categories || []).map(cat => (
                      <span key={cat} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{cat}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400" data-testid={`cert-link-${p.id}`}>
                        <ExternalLink className="w-3 h-3" /> View Certification
                      </Button>
                    </a>
                    <Link to={`/academy/courses?category=${(p.prep_categories || [])[0] || ''}`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs">
                        <BookOpen className="w-3 h-3" /> Prep Courses
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 p-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to get certified?</h3>
          <p className="text-sm text-gray-500 mb-4">Start with our free courses to prepare for your certification exam.</p>
          <Link to="/academy/courses">
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CertificationPathways;
