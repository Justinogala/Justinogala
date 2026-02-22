import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: "Free Plan",
    price: "$0",
    period: "/mo",
    features: [
      "10 hours of transcription/mo",
      "Basic AI summaries",
      "1 User",
      "Google Meet Integration",
      "7-day history retention"
    ],
    cta: "Get Started",
    variant: "outline"
  },
  {
    name: "Pro Plan",
    price: "$29",
    period: "/mo",
    recommended: true,
    features: [
      "100 hours of transcription/mo",
      "Advanced AI insights",
      "Unlimited history",
      "Zoom & Teams Integration",
      "Priority Support",
      "Export to PDF/Docx"
    ],
    cta: "Start Free Trial",
    variant: "default"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited transcription",
      "Custom AI models",
      "SSO & Audit Logs",
      "Dedicated Success Manager",
      "On-premise deployment",
      "SLA Guarantees"
    ],
    cta: "Contact Sales",
    variant: "outline"
  }
];

const PricingSection = () => {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={plan.recommended ? 'md:-mt-4 md:mb-4 relative z-10' : ''}
            >
              <Card 
                className={`h-full flex flex-col bg-white dark:bg-slate-900 ${
                  plan.recommended 
                    ? 'border-2 border-violet-500 shadow-xl shadow-violet-500/10 dark:shadow-none' 
                    : 'border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-none'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Badge className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1 font-medium">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow px-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="p-8 pt-4">
                  <Button 
                    className={`w-full h-12 text-lg rounded-xl font-semibold ${
                      plan.recommended 
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25' 
                        : 'text-gray-900 dark:text-white border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                    variant={plan.variant}
                  >
                    {plan.cta}
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