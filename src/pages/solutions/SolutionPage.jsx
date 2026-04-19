import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Clock, FileSignature, FolderOpen, Video, Brain, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const DOMAIN = 'https://munal.ai';

const SolutionPage = ({ industry, headline, subtitle, description, metaTitle, metaDescription, features, faqs, useCases, ctaText, heroImage }) => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.a }
    }))
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `Munal AI for ${industry}`,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "url": `${DOMAIN}/solutions/${industry.toLowerCase()}`,
    "description": metaDescription,
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "featureList": features.map(f => f.title)
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
        <Helmet>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          <meta name="keywords" content={`Munal AI, ${industry}, AI meeting summaries, shift management, eSignature, document management, enterprise security, workforce platform`} />
          <link rel="canonical" href={`${DOMAIN}/solutions/${industry.toLowerCase()}`} />
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={`${DOMAIN}/solutions/${industry.toLowerCase()}`} />
          <meta property="og:type" content="website" />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        </Helmet>

        <Header />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative py-20 lg:py-28 overflow-hidden bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6 border border-violet-200 dark:border-violet-800">
                    <Building2 className="w-4 h-4" /> {industry} Solutions
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
                    {headline}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/signup">
                      <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 rounded-full px-8 text-base font-semibold" data-testid="geo-cta-primary">
                        {ctaText || 'Start Free Trial'} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700 rounded-full px-8 text-base" data-testid="geo-cta-contact">
                        Talk to Sales
                      </Button>
                    </Link>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  {heroImage && (
                    <img
                      src={heroImage}
                      alt={`${industry} teams using Munal AI`}
                      className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
                      loading="lazy"
                      data-testid="geo-hero-image"
                    />
                  )}
                </motion.div>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Built for {industry} Teams
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {description}
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-lg transition-all bg-gray-50 dark:bg-slate-800/50"
                    data-testid={`geo-feature-${i}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feat.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feat.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                How {industry} Organizations Use Munal AI
              </h2>
              <div className="space-y-6">
                {useCases.map((uc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
                    data-testid={`geo-usecase-${i}`}
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{uc.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{uc.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-20 bg-white dark:bg-slate-900">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4" data-testid="geo-faq-section">
                {faqs.map((faq, i) => (
                  <details key={i} className="group rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden" data-testid={`geo-faq-${i}`}>
                    <summary className="flex items-center justify-between p-5 cursor-pointer bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-semibold text-gray-900 dark:text-white text-sm">
                      {faq.q}
                      <ArrowRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                    </summary>
                    <div className="p-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-slate-700">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-gradient-to-r from-violet-600 to-indigo-600">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Transform Your {industry} Workflows?
              </h2>
              <p className="text-white/80 mb-8 text-base">
                Join thousands of {industry.toLowerCase()} professionals using Munal AI to streamline operations and boost productivity.
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-white text-violet-700 hover:bg-gray-100 rounded-full px-10 text-base font-semibold shadow-lg">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default SolutionPage;
