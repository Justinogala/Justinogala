
import React from 'react';
import { Check, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { cn } from '@/lib/utils';

const PlanComparisonTable = ({ currentPlanId, onUpgrade, isLoading }) => {
  return (
    <div className="overflow-x-auto pb-4 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm bg-white dark:bg-slate-900">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr>
            <th className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800 min-w-[200px] text-gray-900 dark:text-white font-bold">Features</th>
            {SUBSCRIPTION_PLANS.map(plan => (
              <th key={plan.id} className="p-4 text-center border-b border-gray-200 dark:border-slate-800 min-w-[180px]">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    ${plan.price.monthly}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Feature Rows */}
          {[
            { label: 'Transcriptions', key: 'limits.transcriptions', format: (v) => v > 1000 ? 'Unlimited' : `${v}/mo` },
            { label: 'Audio Minutes', key: 'limits.audioMinutes', format: (v) => v > 1000 ? 'Unlimited' : `${v} mins` },
            { label: 'Storage', key: 'limits.storageGB', format: (v) => v > 1000 ? 'Unlimited' : `${v} GB` },
            { label: 'API Access', key: 'limits.apiCalls', format: (v) => v > 1000 ? 'Unlimited' : v },
          ].map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-gray-50/50 dark:bg-slate-900/50'}>
              <td className="p-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800/50">
                {row.label}
              </td>
              {SUBSCRIPTION_PLANS.map(plan => {
                const val = row.key.split('.').reduce((o, i) => o[i], plan);
                return (
                  <td key={plan.id} className="p-4 text-center border-b border-gray-100 dark:border-slate-800/50 text-gray-700 dark:text-gray-300 font-medium">
                    {row.format(val)}
                  </td>
                );
              })}
            </tr>
          ))}
          
          {/* Detailed Features */}
          {['High Quality Model', 'Export PDF/Docx', 'Priority Support', 'Custom Branding'].map((feature, idx) => (
            <tr key={`feat-${idx}`} className="bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
              <td className="p-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800/50">
                {feature}
              </td>
              {SUBSCRIPTION_PLANS.map(plan => {
                // Heuristic check for visual purposes
                const enabled = plan.id === 'plan_enterprise' || (plan.id === 'plan_pro' && feature !== 'Custom Branding') || (plan.id === 'plan_free' && feature === 'High Quality Model');
                
                return (
                  <td key={plan.id} className="p-4 text-center border-b border-gray-100 dark:border-slate-800/50">
                    {enabled ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-500 mx-auto" />
                    ) : (
                      <Minus className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Action Buttons */}
          <tr>
            <td className="p-4 bg-white dark:bg-slate-950"></td>
            {SUBSCRIPTION_PLANS.map(plan => {
              const isCurrent = currentPlanId === plan.id;
              return (
                <td key={plan.id} className="p-4 text-center bg-white dark:bg-slate-950">
                  <Button 
                    variant={isCurrent ? "outline" : plan.highlight ? "default" : "secondary"}
                    className={cn(
                      "w-full font-semibold", 
                      plan.highlight && "bg-indigo-600 hover:bg-indigo-700 text-white",
                      !plan.highlight && !isCurrent && "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700"
                    )}
                    disabled={isCurrent || isLoading}
                    onClick={() => onUpgrade(plan.id)}
                  >
                    {isCurrent ? "Current Plan" : "Choose " + plan.name}
                  </Button>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PlanComparisonTable;
