import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Check, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

import { getApiUrl, API_URL } from '@/lib/api';

const PricingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const handleSubscribe = async (planId) => {
    // Free plan - just go to signup
    if (planId === 'free') {
      if (isAuthenticated) {
        toast({ title: 'You already have an account!' });
      } else {
        navigate('/signup');
      }
      return;
    }

    // Paid plans - create Stripe checkout
    setLoadingPlan(planId);
    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          billing_period: isAnnual ? 'yearly' : 'monthly',
          user_id: user?.id || null,
          user_email: user?.email || null,
          origin_url: window.location.origin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Checkout Error', 
        description: error.message || 'Failed to start checkout. Please try again.' 
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const pricingTiers = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for individuals getting started',
      features: [
        { text: '5 video meetings per month', included: true },
        { text: '30 minutes AI transcription', included: true },
        { text: '1 GB secure cloud storage', included: true },
        { text: 'Basic AI-powered transcription', included: true },
        { text: 'Instant video meetings with screen share', included: true },
        { text: 'Team chat messaging', included: true },
        { text: 'Calendar & scheduling', included: true },
        { text: 'Text-to-Audio conversion (basic)', included: true },
        { text: 'Email support', included: true }
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'Best for professionals & growing teams',
      features: [
        { text: '50 video meetings per month', included: true },
        { text: '300 minutes AI transcription', included: true },
        { text: '5 GB secure cloud storage', included: true },
        { text: 'AI-powered transcription', included: true },
        { text: 'HD video meetings with recording', included: true },
        { text: 'Team chat messaging', included: true },
        { text: 'Voice chat channels', included: true },
        { text: 'Text-to-Audio conversion', included: true },
        { text: 'Priority email support', included: true }
      ],
      cta: 'Start Pro',
      popular: true
    },
    {
      id: 'business',
      name: 'Business',
      price: '$39',
      period: '/month',
      description: 'For growing teams and startups',
      features: [
        { text: '150 video meetings per month', included: true },
        { text: '1000 minutes AI transcription', included: true },
        { text: '25 GB secure cloud storage', included: true },
        { text: 'Advanced AI transcription with speaker ID', included: true },
        { text: 'HD video meetings with recording', included: true },
        { text: 'Screen sharing & collaboration', included: true },
        { text: 'Unlimited team chat', included: true },
        { text: 'Voice chat channels', included: true },
        { text: 'Priority support', included: true }
      ],
      cta: 'Start Business',
      popular: false
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$79',
      period: '/month',
      description: 'For large organizations',
      features: [
        { text: 'Unlimited video meetings', included: true },
        { text: 'Unlimited AI transcription', included: true },
        { text: '100 GB secure cloud storage', included: true },
        { text: 'Enterprise-grade AI transcription', included: true },
        { text: '4K video meetings with recording', included: true },
        { text: 'Screen sharing & virtual backgrounds', included: true },
        { text: 'Unlimited team chat', included: true },
        { text: 'Voice chat channels', included: true },
        { text: '24/7 dedicated support', included: true }
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const comparisonFeatures = [
    { category: 'Meetings & Video', features: [
      { name: 'Meetings per month', free: '5', pro: '50', business: '150', enterprise: 'Unlimited' },
      { name: 'Instant video meetings', free: true, pro: true, business: true, enterprise: true },
      { name: 'Screen sharing', free: true, pro: true, business: true, enterprise: true },
      { name: 'Meeting recording', free: false, pro: true, business: true, enterprise: true },
      { name: 'Video quality', free: 'HD', pro: 'HD', business: 'HD', enterprise: '4K' }
    ]},
    { category: 'Transcription & AI', features: [
      { name: 'Transcription minutes/month', free: '30', pro: '300', business: '1000', enterprise: 'Unlimited' },
      { name: 'AI-powered accuracy', free: 'Standard', pro: 'High', business: 'Advanced', enterprise: 'Enterprise' },
      { name: 'Speaker identification', free: false, pro: true, business: true, enterprise: true },
      { name: 'AI summaries', free: 'Basic', pro: 'Standard', business: 'Advanced', enterprise: 'Advanced' },
      { name: 'Text to audio', free: true, pro: true, business: true, enterprise: true }
    ]},
    { category: 'Text to Video', features: [
      { name: 'Video generation', free: 'Up to 4s', pro: 'Up to 8s', business: 'Up to 24s', enterprise: 'Up to 60s' },
      { name: 'Extended multi-clip', free: false, pro: false, business: true, enterprise: true },
      { name: 'Video history', free: true, pro: true, business: true, enterprise: true }
    ]},
    { category: 'Storage & Files', features: [
      { name: 'Cloud storage', free: '1 GB', pro: '5 GB', business: '25 GB', enterprise: '100 GB' },
      { name: 'File management', free: true, pro: true, business: true, enterprise: true },
      { name: 'Cloud provider config', free: false, pro: false, business: false, enterprise: true }
    ]},
    { category: 'Team & Collaboration', features: [
      { name: 'Team workspaces', free: '1', pro: '3', business: '10', enterprise: 'Unlimited' },
      { name: 'Team members', free: '1', pro: '5', business: '25', enterprise: 'Unlimited' },
      { name: 'Admin dashboard', free: false, pro: false, business: true, enterprise: true }
    ]},
    { category: 'Calendar & Scheduling', features: [
      { name: 'Full calendar', free: true, pro: true, business: true, enterprise: true },
      { name: 'Jizira integration', free: true, pro: true, business: true, enterprise: true },
      { name: 'Recurring events', free: true, pro: true, business: true, enterprise: true }
    ]},
    { category: 'Support', features: [
      { name: 'Email support', free: true, pro: true, business: true, enterprise: true },
      { name: 'Priority support', free: false, pro: true, business: true, enterprise: true },
      { name: '24/7 dedicated support', free: false, pro: false, business: false, enterprise: true }
    ]}
  ];

  const faqs = [
    {
      question: 'How does the transcription minute limit work?',
      answer: 'Your monthly limit resets on the same day each month. Unused minutes do not roll over. If you exceed your limit, you can upgrade your plan or purchase additional minutes.'
    },
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the change takes effect at your next billing cycle.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support MP3, WAV, M4A, and MP4 files. Maximum file size is 100MB per upload. For larger files, please contact our support team.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard encryption for data in transit and at rest. Your recordings and transcripts are never shared with third parties and are stored securely on our servers.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 14-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us within 14 days of your purchase for a full refund.'
    },
    {
      question: 'Can I get a custom plan for my organization?',
      answer: 'Yes! If you need more than 2000 minutes per month or have specific requirements, please contact our sales team to discuss a custom enterprise plan.'
    }
  ];

  const renderFeatureValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-400 dark:text-gray-600 mx-auto" />
      );
    }
    return <span className="text-gray-900 dark:text-white font-medium">{value}</span>;
  };

  return (
    <>
      <Helmet>
        <title>Pricing - Munal</title>
        <meta name="description" content="Choose the perfect Munal plan for your meeting transcription needs. Start free or upgrade for advanced features." />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
        <Header />

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 pt-header-mobile md:pt-header-tablet lg:pt-header-desktop overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img src="https://images.pexels.com/photos/7293745/pexels-photo-7293745.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-gray-50/90 to-white/95 dark:from-slate-950/93 dark:via-slate-900/88 dark:to-slate-900/95" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Simple, Transparent Munal Pricing
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Choose the plan that fits your needs. All plans include a 14-day free trial.
              </p>
            </motion.div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    hover 
                    className={`h-full relative flex flex-col bg-white dark:bg-slate-900 ${
                      tier.popular 
                        ? 'border-2 border-indigo-500 shadow-2xl dark:shadow-indigo-900/20' 
                        : 'border border-gray-200 dark:border-slate-800 shadow-lg'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 rounded-full text-sm font-semibold text-white shadow-lg">
                        Most Popular
                      </div>
                    )}
                    <CardContent className="pt-8 flex-1 flex flex-col">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tier.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{tier.description}</p>
                        <div className="mb-4">
                          <span className="text-5xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                          <span className="text-gray-500 dark:text-gray-400 font-medium">{tier.period}</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                            )}
                            <span className={feature.included ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 line-through'}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className="w-full h-12 text-base font-semibold"
                        variant={tier.popular ? 'default' : 'outline'}
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={loadingPlan === tier.id}
                      >
                        {loadingPlan === tier.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          tier.cta
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Detailed Feature Comparison
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                See exactly what's included in each plan
              </p>
            </motion.div>

            <div className="max-w-6xl mx-auto overflow-x-auto border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                    <th className="text-left py-4 px-6 text-gray-600 dark:text-gray-400 font-semibold w-1/5">Feature</th>
                    <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-bold w-1/5">Free</th>
                    <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-bold w-1/5">Pro</th>
                    <th className="text-center py-4 px-4 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/10 w-1/5">Business</th>
                    <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-bold w-1/5">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {comparisonFeatures.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <tr>
                        <td colSpan="5" className="py-4 px-6 bg-gray-50/50 dark:bg-slate-900/50">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">{category.category}</h3>
                        </td>
                      </tr>
                      {category.features.map((feature, featIndex) => (
                        <tr key={featIndex} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-6 text-gray-700 dark:text-gray-300 font-medium">{feature.name}</td>
                          <td className="py-4 px-4 text-center">{renderFeatureValue(feature.free)}</td>
                          <td className="py-4 px-4 text-center">{renderFeatureValue(feature.pro)}</td>
                          <td className="py-4 px-4 text-center bg-indigo-50/20 dark:bg-indigo-900/5">{renderFeatureValue(feature.business)}</td>
                          <td className="py-4 px-4 text-center">{renderFeatureValue(feature.enterprise)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Got questions? We've got answers.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="cursor-pointer border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-8">{faq.question}</h3>
                        {expandedFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                      {expandedFaq === index && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed"
                        >
                          {faq.answer}
                        </motion.p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0 shadow-2xl overflow-hidden relative">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
                
                <CardContent className="py-16 px-6 relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                    Ready to Get Started with Munal?
                  </h2>
                  <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                    Try Munal free for 14 days. No credit card required.
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-white text-indigo-700 hover:bg-indigo-50 h-14 px-8 text-lg font-semibold shadow-lg"
                    onClick={() => navigate('/signup')}
                  >
                    Start Your Free Trial
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default PricingPage;