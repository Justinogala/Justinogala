
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PlanComparison = ({ currentPlan, onUpgrade }) => {
  const plans = [
    { name: 'Free', price: '$0', features: ['5 hours/mo transcription', 'Basic summaries', '1 Workspace'] },
    { name: 'Pro', price: '$19', features: ['Unlimited transcription', 'Advanced AI insights', '5 Workspaces', 'Priority support'] },
    { name: 'Team', price: '$49', features: ['Everything in Pro', 'Unlimited Workspaces', 'Admin controls', 'SSO'] }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div 
          key={plan.name}
          className={`relative rounded-xl border p-6 ${
            currentPlan === plan.name 
              ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20' 
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900'
          }`}
        >
          {currentPlan === plan.name && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
              Current Plan
            </span>
          )}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-lg">{plan.name}</h3>
            <div className="text-3xl font-bold mt-2">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
          </div>
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button 
            className="w-full" 
            variant={currentPlan === plan.name ? "outline" : "default"}
            disabled={currentPlan === plan.name}
            onClick={() => onUpgrade(plan.name)}
          >
            {currentPlan === plan.name ? 'Active' : 'Upgrade'}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PlanComparison;
