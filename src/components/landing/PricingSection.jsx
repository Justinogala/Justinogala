import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

// Fallback plans if API fails
const fallbackPlans = [
  {
    id: "plan_free",
    name: "Free",
    description: "Perfect for getting started",
    price_monthly: 0,
    features: [
      "5 video meetings per month",
      "30 minutes AI transcription",
      "1 GB secure cloud storage",
      "Text to Video (up to 4s)",
      "Basic AI features",
      "Email support"
    ],
    is_popular: false
  },
  {
    id: "plan_pro",
    name: "Pro",
    description: "For professionals and freelancers",
    price_monthly: 19,
    features: [
      "50 video meetings per month",
      "300 minutes AI transcription",
      "5 GB secure cloud storage",
      "Text to Video (up to 8s)",
      "Up to 3 workspaces",
      "Priority email support"
    ],
    is_popular: false
  },
  {
    id: "plan_business",
    name: "Business",
    description: "For growing teams and startups",
    price_monthly: 39,
    features: [
      "150 video meetings per month",
      "1000 minutes AI transcription",
      "25 GB secure cloud storage",
      "Text to Video (up to 24s)",
      "Up to 25 team members",
      "Priority chat & email support"
    ],
    is_popular: true
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price_monthly: 79,
    features: [
      "Unlimited video meetings",
      "Unlimited AI transcription",
      "100 GB secure cloud storage",
      "Text to Video (up to 60s)",
      "Unlimited team members",
      "24/7 dedicated support"
    ],
    is_popular: false
  }
];

const PricingSection = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/plans`);
        if (res.ok) {
          const data = await res.json();
          // Filter active plans and limit features shown
          const activePlans = (data.plans || [])
            .filter(p => p.is_active)
            .map(p => ({
              ...p,
              // Show max 6 features on landing page
              displayFeatures: p.features?.slice(0, 6) || []
            }));
          setPlans(activePlans.length > 0 ? activePlans : fallbackPlans);
        } else {
          setPlans(fallbackPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlans(fallbackPlans);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleCTA = (plan) => {
    if (plan.price_monthly === 0) {
      navigate('/signup');
    } else if (plan.name.toLowerCase() === 'enterprise') {
      navigate('/contact');
    } else {
      navigate('/signup');
    }
  };

  const getButtonText = (plan) => {
    if (plan.price_monthly === 0) return 'Get Started';
    if (plan.name.toLowerCase() === 'enterprise') return 'Contact Sales';
    return 'Start Free Trial';
  };

  const formatPrice = (plan) => {
    if (plan.price_monthly === 0) return '$0';
    if (plan.name.toLowerCase() === 'enterprise' && plan.price_monthly >= 99) return '$99';
    return `$${plan.price_monthly}`;
  };

  if (loading) {
    return (
      <section className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-6 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your team's needs. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={plan.is_popular ? 'lg:-mt-4 lg:mb-4 relative z-10' : ''}
            >
              <Card 
                className={`h-full flex flex-col bg-white dark:bg-slate-900 ${
                  plan.is_popular 
                    ? 'border-2 border-violet-500 shadow-xl shadow-violet-500/10 dark:shadow-none' 
                    : 'border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-none'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Badge className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name} {plan.price_monthly > 0 && 'Plan'}
                  </CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(plan)}
                    </span>
                    {plan.price_monthly > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1 font-medium">/mo</span>
                    )}
                    {plan.price_monthly === 0 && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1 font-medium">/mo</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="flex-grow px-8">
                  <ul className="space-y-4">
                    {(plan.displayFeatures || plan.features || []).map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="p-8 pt-4">
                  <Button 
                    onClick={() => handleCTA(plan)}
                    className={`w-full h-12 text-lg rounded-xl font-semibold ${
                      plan.is_popular 
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25' 
                        : 'text-gray-900 dark:text-white border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                    variant={plan.is_popular ? 'default' : 'outline'}
                    data-testid={`pricing-cta-${plan.id}`}
                  >
                    {getButtonText(plan)}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
