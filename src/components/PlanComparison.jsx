
import React from 'react';
import { Check, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const PlanComparison = ({ onSelectPlan, currentPlanId }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {SUBSCRIPTION_PLANS.map((plan, index) => {
        const isCurrent = currentPlanId === plan.id;
        const isPopular = plan.popular;
        
        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative h-full"
          >
            {isPopular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-lg">
                  <Star className="w-3 h-3 mr-1 fill-current" /> Most Popular
                </span>
              </div>
            )}
            
            <Card className={cn(
              "h-full flex flex-col border-2 transition-all duration-300 bg-white dark:bg-slate-900",
              isPopular ? "border-indigo-500 shadow-xl scale-105" : "border-gray-200 dark:border-slate-800",
              isCurrent ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950" : ""
            )}>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    ${plan.price.USD}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">/{plan.interval}</span>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow">
                <div className="border-t border-gray-100 dark:border-slate-800 my-4"></div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-500 mr-2 shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  onClick={() => onSelectPlan && onSelectPlan(plan.id)}
                  disabled={isCurrent}
                  className={cn(
                    "w-full font-semibold",
                    isPopular ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-gray-900 dark:text-white border-gray-300 dark:border-slate-700",
                    isCurrent ? "bg-emerald-600 hover:bg-emerald-700 text-white opacity-100" : ""
                  )}
                  variant={isPopular || isCurrent ? "default" : "outline"}
                >
                  {isCurrent ? "Current Plan" : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlanComparison;
