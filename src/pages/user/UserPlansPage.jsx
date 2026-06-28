import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Check, X, Zap, Star, Crown, ArrowRight, Loader2, TrendingUp, Shield, GraduationCap, Video, Mic, Cloud, Users, Bot, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

import { API_URL } from '@/lib/api';

const PLAN_ICONS = { Free: Zap, Pro: Star, Business: TrendingUp, Enterprise: Crown };
const PLAN_COLORS = {
  Free: { accent: '#6366F1', bg: 'from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20', border: 'border-indigo-200 dark:border-indigo-800' },
  Pro: { accent: '#7C3AED', bg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20', border: 'border-violet-300 dark:border-violet-700' },
  Business: { accent: '#2563EB', bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20', border: 'border-blue-200 dark:border-blue-800' },
  Enterprise: { accent: '#059669', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
};

const ACADEMY_FEATURES = {
  Free: ['Access to free courses', 'Community discussions', 'Practice labs', 'Basic AI Tutor (limited)'],
  Pro: ['All free courses + Pro courses', 'Unlimited AI Tutor', 'AI lesson summaries', 'Completion certificates', 'Learning pathways', 'Capstone projects'],
  Business: ['Everything in Pro', 'Team learning dashboards', 'Custom course creation', 'Priority support', 'Admin analytics'],
  Enterprise: ['Everything in Business', 'Dedicated account manager', 'Custom learning paths', 'SSO for teams', 'API access', 'White-label certificates'],
};

const UserPlansPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState('free');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const plansRes = await fetch(`${API_URL}/api/payments/plans`);
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);

        if (user?.id) {
          const subRes = await fetch(`${API_URL}/api/payments/user/${user.id}/subscription`);
          const subData = await subRes.json();
          if (subData.subscription) setCurrentPlanId(subData.subscription.plan_id || 'free');
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  const handleUpgrade = async (plan) => {
    if (plan.price_monthly === 0) {
      toast({ title: "You're on the Free plan", description: "This is your current plan." });
      return;
    }
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setCheckoutLoading(plan.id);
    try {
      const res = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_period: isAnnual ? 'yearly' : 'monthly',
          origin_url: window.location.origin,
          user_id: user.id,
          user_email: user.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create checkout');
      if (data.url) window.location.href = data.url;
      else throw new Error('No checkout URL received');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Payment Error', description: e.message });
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
    </div>
  );

  const orderedPlans = ['free', 'pro', 'business', 'enterprise']
    .map(id => plans.find(p => p.id === id))
    .filter(Boolean);

  return (
    <div data-testid="plans-page">
      <Helmet><title>Plans & Pricing | Munal AI</title></Helmet>

      {/* Header */}
      <div className="text-center mb-10">
        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 mb-4 px-3 py-1">Pricing</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto mb-6">
          Choose the plan that fits your needs. All plans include core features. Upgrade anytime.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2" data-testid="billing-toggle">
          <span className={cn("text-sm font-medium", !isAnnual ? "text-gray-900 dark:text-white" : "text-gray-400")}>Monthly</span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <span className={cn("text-sm font-medium", isAnnual ? "text-gray-900 dark:text-white" : "text-gray-400")}>
            Annual
          </span>
          {isAnnual && <Badge className="bg-green-100 text-green-700 text-[10px] ml-1">Save 17%</Badge>}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
        {orderedPlans.map(plan => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.is_popular;
          const Icon = PLAN_ICONS[plan.name] || Zap;
          const colors = PLAN_COLORS[plan.name] || PLAN_COLORS.Free;
          const price = isAnnual ? Math.round((plan.price_annual || plan.price_monthly * 10) / 12) : plan.price_monthly;
          const academyFeatures = ACADEMY_FEATURES[plan.name] || [];

          return (
            <div key={plan.id}
              className={cn(
                "relative rounded-2xl border-2 bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-xl",
                isPopular ? "border-violet-500 dark:border-violet-400 shadow-lg shadow-violet-500/10 scale-[1.02]" : "border-gray-200 dark:border-gray-700",
                isCurrent && "ring-2 ring-green-400 ring-offset-2"
              )} data-testid={`plan-card-${plan.id}`}>

              {/* Popular badge */}
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-center py-1.5 text-xs font-semibold">
                  Most Popular
                </div>
              )}
              {isCurrent && !isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-1.5 text-xs font-semibold">
                  Current Plan
                </div>
              )}

              <div className={cn("p-6", (isPopular || isCurrent) && "pt-10")}>
                {/* Icon + Name */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br", colors.bg)}>
                  <Icon className="w-6 h-6" style={{ color: colors.accent }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-5">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${price}</span>
                    <span className="text-sm text-gray-400">/month</span>
                  </div>
                  {isAnnual && plan.price_monthly > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ${plan.price_annual || plan.price_monthly * 10}/year — save ${(plan.price_monthly * 12) - (plan.price_annual || plan.price_monthly * 10)}
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                {isCurrent ? (
                  <Button disabled className="w-full mb-6 gap-2" variant="outline" data-testid={`btn-current-${plan.id}`}>
                    <Check className="w-4 h-4" /> Current Plan
                  </Button>
                ) : plan.price_monthly === 0 ? (
                  <Button disabled className="w-full mb-6" variant="outline">Free Forever</Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan)}
                    disabled={checkoutLoading === plan.id}
                    className={cn("w-full mb-6 gap-2 font-semibold",
                      isPopular ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20" : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    )} data-testid={`btn-upgrade-${plan.id}`}>
                    {checkoutLoading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Upgrade
                  </Button>
                )}

                {/* Platform Features */}
                <div className="mb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Platform</p>
                  <ul className="space-y-2">
                    {(plan.features || []).slice(0, 7).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {(plan.features || []).length > 7 && (
                      <li className="text-xs text-violet-600 font-medium cursor-pointer hover:underline">
                        +{plan.features.length - 7} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Academy Features */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-2 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Academy
                  </p>
                  <ul className="space-y-2">
                    {academyFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-12">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Full Feature Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Feature</th>
                {orderedPlans.map(p => (
                  <th key={p.id} className="text-center px-4 py-3 font-semibold text-gray-900 dark:text-white">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {[
                { name: 'Video Meetings', values: ['5/mo', '50/mo', '150/mo', 'Unlimited'] },
                { name: 'AI Transcription', values: ['30 min', '300 min', '1000 min', 'Unlimited'] },
                { name: 'Cloud Storage', values: ['1 GB', '5 GB', '25 GB', '100 GB'] },
                { name: 'Team Members', values: ['1', '5', '25', 'Unlimited'] },
                { name: 'Workspaces', values: ['1', '3', '10', 'Unlimited'] },
                { name: 'HD Recording', values: [false, true, true, true] },
                { name: 'AI Chat & Builder', values: ['Basic', 'Full', 'Full', 'Full + API'] },
                { name: 'Text-to-Video', values: ['4s', '8s', '24s', '60s'] },
                { name: 'Academy Courses', values: ['Free only', 'All courses', 'All courses', 'All + Custom'] },
                { name: 'AI Tutor', values: ['Limited', 'Unlimited', 'Unlimited', 'Unlimited'] },
                { name: 'Certificates', values: [false, true, true, true] },
                { name: 'Learning Pathways', values: [false, true, true, true] },
                { name: 'Team Analytics', values: [false, false, true, true] },
                { name: 'SSO/SAML', values: [false, false, false, true] },
                { name: 'Dedicated Support', values: [false, false, false, true] },
              ].map(row => (
                <tr key={row.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{row.name}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="text-center px-4 py-3">
                      {v === true ? <Check className="w-4 h-4 text-green-500 mx-auto" /> :
                       v === false ? <X className="w-4 h-4 text-gray-300 mx-auto" /> :
                       <span className="text-gray-700 dark:text-gray-300 font-medium">{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trust Section */}
      <div className="text-center py-8 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-gray-400">
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> 256-bit SSL Encryption</span>
          <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Secure Stripe Payments</span>
          <span className="flex items-center gap-1.5"><ArrowRight className="w-4 h-4" /> Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
};

// Need these imports for the trust section icons
import { CreditCard } from 'lucide-react';

export default UserPlansPage;
