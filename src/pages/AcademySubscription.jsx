import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Check, Lock, Star, Loader2, ArrowLeft, Crown, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_BASE = window.location.origin;

const PLAN_ICONS = { free: Star, pro: Crown, enterprise: Shield };
const PLAN_COLORS = {
  free: 'border-gray-200 dark:border-gray-700',
  pro: 'border-violet-400 ring-2 ring-violet-200 dark:ring-violet-800',
  enterprise: 'border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-800',
};

const AcademySubscription = () => {
  const [plans, setPlans] = useState({});
  const [currentPlan, setCurrentPlan] = useState('free');
  const [subscribing, setSubscribing] = useState(null);
  const [polling, setPolling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = JSON.parse(localStorage.getItem('munal_sessions') || '{}').token;

  useEffect(() => {
    // Fetch plans
    fetch(`${API_BASE}/api/academy/subscriptions/plans`).then(r => r.json()).then(d => setPlans(d.plans || {}));

    // Check current subscription
    if (token) {
      fetch(`${API_BASE}/api/academy/subscriptions/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        if (d.active) setCurrentPlan(d.plan);
      });
    }
  }, [token]);

  // Handle return from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const payment = searchParams.get('payment');
    if (sessionId && payment === 'success' && token) {
      setPolling(true);
      pollPaymentStatus(sessionId, 0);
    }
  }, [searchParams, token]);

  const pollPaymentStatus = async (sessionId, attempts) => {
    if (attempts >= 8) {
      setPolling(false);
      toast({ variant: 'destructive', title: 'Payment verification timed out. Please refresh.' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/academy/subscriptions/checkout/status/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.status === 'paid') {
        setCurrentPlan(d.plan);
        setPolling(false);
        toast({ title: `${d.plan.charAt(0).toUpperCase() + d.plan.slice(1)} plan activated!`, description: 'Welcome to premium!' });
        // Clean URL
        window.history.replaceState({}, '', '/academy/subscription');
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2500);
      }
    } catch {
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2500);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!token) { navigate('/login'); return; }
    setSubscribing(plan);
    try {
      const res = await fetch(`${API_BASE}/api/academy/subscriptions/checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, origin_url: window.location.origin })
      });
      const d = await res.json();
      if (res.ok && d.checkout_url) {
        window.location.href = d.checkout_url;
      } else {
        toast({ variant: 'destructive', title: d.detail || 'Failed to start checkout' });
      }
    } catch { toast({ variant: 'destructive', title: 'Network error' }); }
    finally { setSubscribing(null); }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/academy/subscriptions/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '' })
      });
      if (res.ok) {
        setCurrentPlan('free');
        toast({ title: 'Subscription cancelled' });
      }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const planOrder = ['free', 'pro', 'enterprise'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Helmet><title>Subscription Plans | Munal AI Academy</title></Helmet>
      <Header />

      {/* Polling Overlay */}
      {polling && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center max-w-sm">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verifying Payment...</h3>
            <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your subscription.</p>
          </div>
        </div>
      )}

      <section className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Unlock premium courses, livestream access, certificates, and more.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="pricing-plans">
          {planOrder.map(planKey => {
            const plan = plans[planKey];
            if (!plan) return null;
            const Icon = PLAN_ICONS[planKey];
            const isCurrent = currentPlan === planKey;
            const isPopular = planKey === 'pro';

            return (
              <div key={planKey} className={cn("relative bg-white dark:bg-slate-900 rounded-2xl border p-6 transition-all", PLAN_COLORS[planKey], isPopular && "scale-105 shadow-xl")} data-testid={`plan-${planKey}`}>
                {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-600 text-white text-xs font-bold">Most Popular</div>}
                <div className="text-center mb-6">
                  <div className={cn("w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center", planKey === 'free' ? 'bg-gray-100' : planKey === 'pro' ? 'bg-violet-100' : 'bg-indigo-100')}>
                    <Icon className={cn("w-6 h-6", planKey === 'free' ? 'text-gray-500' : planKey === 'pro' ? 'text-violet-600' : 'text-indigo-600')} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="mt-2">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
                    ) : (
                      <><span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span><span className="text-gray-400">/mo</span></>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className={cn("w-4 h-4 shrink-0 mt-0.5", planKey === 'free' ? 'text-gray-400' : 'text-green-500')} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="space-y-2">
                    <Badge className="w-full justify-center py-2 bg-green-100 text-green-700">Current Plan</Badge>
                    {planKey !== 'free' && (
                      <Button variant="ghost" size="sm" className="w-full text-xs text-gray-400" onClick={handleCancel}>Cancel Subscription</Button>
                    )}
                  </div>
                ) : planKey === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>Free Forever</Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(planKey)}
                    disabled={!!subscribing}
                    className={cn("w-full gap-2", planKey === 'pro' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-indigo-600 hover:bg-indigo-700', "text-white")}
                    data-testid={`subscribe-${planKey}`}
                  >
                    {subscribing === planKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {subscribing === planKey ? 'Processing...' : `Get ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AcademySubscription;
