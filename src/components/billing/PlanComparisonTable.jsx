import React from 'react';
import { Check, X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import { cn } from '@/lib/utils';

const PlanComparisonTable = ({ currentPlanId, onUpgrade, isLoading }) => {
  return (
    <div className="overflow-x-auto pb-4 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm bg-white dark:bg-slate-900">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr>
            <th className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800 min-w-[180px] text-gray-900 dark:text-white font-bold">Features</th>
            {SUBSCRIPTION_PLANS.map(plan => (
              <th key={plan.id} className={cn(
                "p-4 text-center border-b border-gray-200 dark:border-slate-800 min-w-[140px]",
                plan.highlight && "bg-indigo-50/50 dark:bg-indigo-900/10"
              )}>
                <div className="space-y-1">
                  <h3 className={cn(
                    "text-lg font-bold",
                    plan.highlight ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"
                  )}>{plan.name}</h3>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    ${plan.price.monthly}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Core Limits */}
          {[
            { label: 'Meetings/month', key: 'limits.meetingsPerMonth', format: (v) => v === -1 ? 'Unlimited' : v },
            { label: 'Transcription', key: 'limits.transcriptionMinutes', format: (v) => v === -1 ? 'Unlimited' : `${v} mins` },
            { label: 'Storage', key: 'limits.storageGB', format: (v) => v === -1 ? 'Unlimited' : `${v} GB` },
            { label: 'Team Members', key: 'limits.teamMembers', format: (v) => v === -1 ? 'Unlimited' : v },
            { label: 'Workspaces', key: 'limits.workspaces', format: (v) => v === -1 ? 'Unlimited' : v },
            { label: 'Video Duration', key: 'limits.videoDurationSeconds', format: (v) => `Up to ${v}s` },
          ].map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-gray-50/50 dark:bg-slate-900/50'}>
              <td className="p-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800/50">
                {row.label}
              </td>
              {SUBSCRIPTION_PLANS.map(plan => {
                const val = row.key.split('.').reduce((o, i) => o[i], plan);
                return (
                  <td key={plan.id} className={cn(
                    "p-4 text-center border-b border-gray-100 dark:border-slate-800/50 text-gray-700 dark:text-gray-300 font-medium",
                    plan.highlight && "bg-indigo-50/20 dark:bg-indigo-900/5"
                  )}>
                    {row.format(val)}
                  </td>
                );
              })}
            </tr>
          ))}
          
          {/* Feature Checklist */}
          {[
            'HD/4K Video', 
            'Recording', 
            'Voice Chat', 
            'Speaker ID', 
            'AI Summaries', 
            'Admin Dashboard',
            'Priority Support',
            '24/7 Support'
          ].map((feature, idx) => {
            const featureCheck = {
              'HD/4K Video': ['pro', 'business', 'enterprise'],
              'Recording': ['pro', 'business', 'enterprise'],
              'Voice Chat': ['pro', 'business', 'enterprise'],
              'Speaker ID': ['pro', 'business', 'enterprise'],
              'AI Summaries': ['business', 'enterprise'],
              'Admin Dashboard': ['business', 'enterprise'],
              'Priority Support': ['pro', 'business', 'enterprise'],
              '24/7 Support': ['enterprise']
            };
            
            return (
              <tr key={`feat-${idx}`} className="bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="p-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800/50">
                  {feature}
                </td>
                {SUBSCRIPTION_PLANS.map(plan => {
                  const enabled = featureCheck[feature]?.includes(plan.id);
                  
                  return (
                    <td key={plan.id} className={cn(
                      "p-4 text-center border-b border-gray-100 dark:border-slate-800/50",
                      plan.highlight && "bg-indigo-50/20 dark:bg-indigo-900/5"
                    )}>
                      {enabled ? (
                        <Check className="w-5 h-5 text-green-600 dark:text-green-500 mx-auto" />
                      ) : (
                        <Minus className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* Action Buttons */}
          <tr>
            <td className="p-4 bg-white dark:bg-slate-950"></td>
            {SUBSCRIPTION_PLANS.map(plan => {
              const isCurrent = currentPlanId === plan.id;
              return (
                <td key={plan.id} className={cn(
                  "p-4 text-center bg-white dark:bg-slate-950",
                  plan.highlight && "bg-indigo-50/20 dark:bg-indigo-900/5"
                )}>
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
                    {isCurrent ? "Current" : plan.price.monthly === 0 ? "Start Free" : "Choose"}
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
