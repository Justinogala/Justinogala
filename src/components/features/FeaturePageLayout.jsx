
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import DemoVideoModal from '@/components/DemoVideoModal';
import { cn } from '@/lib/utils';

const FeaturePageLayout = ({
  title,
  subtitle,
  description,
  heroImage,
  benefits = [],
  features = [],
  useCases = [],
  relatedFeatures = [],
  ctaTitle = "Ready to get started?",
  ctaDescription = "Join thousands of teams using Munal to boost their productivity.",
  prevFeature,
  nextFeature
}) => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet>
          <title>{title} | Munal Features</title>
          <meta name="description" content={description} />
        </Helmet>
        
        <Header />

        <main className="flex-grow">
          {/* Breadcrumbs */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <Link to="/features/overview" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Features</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">{title}</span>
              </nav>
            </div>
          </div>

          {/* Hero Section */}
          <section className="relative py-20 lg:py-28 overflow-hidden bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 pointer-events-none" />
            
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
                    Feature Highlight
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    {subtitle}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    {description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button size="lg" onClick={() => navigate('/signup')} className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25">
                      Get Started Free
                    </Button>
                    <Button size="lg" variant="outline" className="border-gray-300 dark:border-gray-700" onClick={() => setDemoOpen(true)}>
                      View Demo
                    </Button>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-purple-600/20 rounded-2xl blur-3xl -z-10" />
                  <img 
                    src={heroImage} 
                    alt={title}
                    className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full object-cover aspect-video transform hover:scale-[1.02] transition-transform duration-500"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Benefits Grid */}
          {benefits.length > 0 && (
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold font-heading mb-4 text-gray-900 dark:text-white">Key Benefits</h2>
                  <p className="text-gray-600 dark:text-gray-400">Discover how {title} can transform your workflow.</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {benefits.map((benefit, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    >
                      <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900">
                        <CardContent className="p-8 text-center">
                          <div className="w-12 h-12 mx-auto rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6">
                            <benefit.icon className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{benefit.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{benefit.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Detailed Features List */}
          {features.length > 0 && (
            <section className="py-20 bg-white dark:bg-slate-900">
              <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 className="text-3xl font-bold font-heading mb-8 text-gray-900 dark:text-white">Detailed Capabilities</h2>
                    <div className="space-y-6">
                      {features.map((feature, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex gap-4"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="relative h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 flex items-center justify-center">
                    {/* Placeholder for feature visual/illustration */}
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white dark:bg-slate-800 shadow-inner flex items-center justify-center">
                         <span className="text-4xl">✨</span>
                      </div>
                      <p className="font-medium">Interactive Feature Demo</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Use Cases */}
          {useCases.length > 0 && (
            <section className="py-20 bg-gray-50 dark:bg-slate-950">
              <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold font-heading mb-12 text-center text-gray-900 dark:text-white">Real-World Use Cases</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {useCases.map((useCase, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800"
                    >
                      <h3 className="font-bold text-lg mb-3 text-violet-600 dark:text-violet-400">{useCase.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{useCase.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="py-20 bg-violet-600 dark:bg-violet-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">{ctaTitle}</h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">{ctaDescription}</p>
              <Button 
                size="lg" 
                className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 text-lg"
                onClick={() => navigate('/signup')}
              >
                Get Started Now
              </Button>
            </div>
          </section>

          {/* Navigation & Related */}
          <section className="py-12 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6">
              <div className="flex justify-between items-center">
                {prevFeature ? (
                  <Link to={prevFeature.link} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Previous</div>
                      <div className="font-medium">{prevFeature.name}</div>
                    </div>
                  </Link>
                ) : <div />}
                
                {nextFeature ? (
                  <Link to={nextFeature.link} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group text-right">
                    <div>
                      <div className="text-xs text-gray-400">Next</div>
                      <div className="font-medium">{nextFeature.name}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : <div />}
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
        <DemoVideoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} videoUrl="https://munal.ai/api/demo-video" />
      </div>
    </PageTransition>
  );
};

export default FeaturePageLayout;
