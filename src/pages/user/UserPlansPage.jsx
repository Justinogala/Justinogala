import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Check, Zap, Star, Crown, ArrowRight, Loader2, CreditCard, Calendar, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getApiUrl, API_URL } from '@/lib/api';

const UserPlansPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [currentPlan, setCurrentPlan] = useState({ name: 'Free', price_monthly: 0 });

  // Fetch plans and user subscription
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch plans
        const plansRes = await fetch(`${API_URL}/api/payments/plans`);
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);

        // Fetch user subscription if logged in
        if (user?.id) {
          const subRes = await fetch(`${API_URL}/api/payments/user/${user.id}/subscription`);
          const subData = await subRes.json();
          setSubscription(subData.subscription);
          setUsage(subData.usage);
          if (subData.plan) {
            setCurrentPlan(subData.plan);
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast({ variant: 'destructive', title: 'Failed to load plans' });
      }
      setLoading(false);
    };

    fetchData();
  }, [user?.id, toast]);

  const getIcon = (planName) => {
    const icons = {
      'Free': Zap,
      'Pro': Star,
      'Business': TrendingUp,
      'Enterprise': Crown
    };
    return icons[planName] || Zap;
  };

  const handleUpgrade = async (plan) => {
    if (plan.price_monthly === 0) {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan or it's automatically available."
      });
      return;
    }

    setCheckoutLoading(plan.id);
    
    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_period: isAnnual ? 'yearly' : 'monthly',
          origin_url: window.location.origin,
          user_id: user?.id || null,
          user_email: user?.email || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again."
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCancelPlan = () => {
    toast({
      variant: "destructive",
      title: "Cancel subscription",
      description: "Please contact support to cancel your subscription."
    });
  };

  const isCurrent = (planName) => planName === currentPlan.name;

  const formatLimit = (value) => {
    if (value === -1 || value === "Unlimited") return "Unlimited";
    return value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" data-testid="user-plans-page">
      <Helmet><title>Plans & Billing | Munal</title></Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plans & Billing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and track your usage</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan Summary */}
          <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(getIcon(currentPlan.name), { className: "w-8 h-8 text-indigo-600" })}
                  <div>
                    <CardTitle className="text-xl">Current Plan: {currentPlan.name}</CardTitle>
                    <CardDescription>
                      {subscription?.renewal_date 
                        ? `Next billing: ${new Date(subscription.renewal_date).toLocaleDateString()}`
                        : currentPlan.price_monthly > 0 ? 'Active subscription' : 'Free tier - no billing'
                      }
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-indigo-600 text-white text-lg px-4 py-1">
                  {currentPlan.price_monthly === 0 ? 'Free' : `$${currentPlan.price_monthly}/mo`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    Meetings
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage?.meetings?.used || 0}/{formatLimit(usage?.meetings?.limit || 5)}
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    Transcription
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage?.transcription_minutes?.used || 0}/{formatLimit(usage?.transcription_minutes?.limit || 30)} min
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Storage
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage?.storage_gb?.used || 0}/{formatLimit(usage?.storage_gb?.limit || 1)} GB
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <CreditCard className="w-4 h-4" />
                    Workspaces
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {usage?.workspaces?.used || 1}/{formatLimit(usage?.workspaces?.limit || 1)}
                  </p>
                </div>
              </div>
            </CardContent>
            {currentPlan.price_monthly > 0 && (
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={handleCancelPlan} className="text-red-600 border-red-200 hover:bg-red-50">
                  Cancel Subscription
                </Button>
                <Button variant="outline">
                  Update Payment Method
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Features included */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features Included in {currentPlan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(currentPlan.features || [
                  "5 meetings per month",
                  "30 min transcription", 
                  "1 GB cloud storage",
                  "AI-powered transcription",
                  "Instant video meetings",
                  "Team chat messaging",
                  "Calendar & scheduling",
                  "Basic AI summaries"
                ]).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade prompt for free users */}
          {currentPlan.name === 'Free' && (
            <Alert className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
              <Star className="h-5 w-5 text-violet-600" />
              <AlertDescription className="text-violet-900 dark:text-violet-100">
                <span className="font-semibold">Unlock more features!</span> Upgrade to Pro for 100 meetings/month, 
                500 min transcription, voice chat, and priority support.
                <Button size="sm" className="ml-4 bg-violet-600 hover:bg-violet-700" onClick={() => {
                  const proPlan = plans.find(p => p.name === 'Pro');
                  if (proPlan) handleUpgrade(proPlan);
                }}>
                  Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          {/* Annual Discount Banner */}
          {!isAnnual && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Save 17% with annual billing</p>
                  <p className="text-sm text-green-100">Get 2 months free when you pay yearly</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white text-green-700 hover:bg-green-50"
                onClick={() => setIsAnnual(true)}
              >
                Switch to Annual
              </Button>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
            <Label className={!isAnnual ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500"}>Monthly</Label>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} className="data-[state=checked]:bg-green-600" />
            <Label className={isAnnual ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500"}>
              Annual 
              <Badge className="ml-2 bg-green-600 text-white animate-pulse">
                Save 17%
              </Badge>
            </Label>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const planIsCurrent = isCurrent(plan.name);
              const price = isAnnual ? plan.price_annual : plan.price_monthly;
              const monthlyEquivalent = isAnnual ? Math.round(price / 12) : price;
              const monthlySavings = isAnnual && plan.price_monthly > 0 
                ? Math.round(plan.price_monthly * 12 - price) 
                : 0;
              const Icon = getIcon(plan.name);
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${plan.is_popular ? 'border-indigo-500 dark:border-indigo-400 shadow-lg scale-[1.02]' : ''} ${planIsCurrent ? 'ring-2 ring-green-500' : ''}`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-indigo-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  {planIsCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-600 text-white">Current</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${monthlyEquivalent}
                      </span>
                      <span className="text-gray-500">/month</span>
                      {isAnnual && price > 0 && (
                        <>
                          <p className="text-sm text-gray-500 mt-1">
                            Billed ${price}/year
                          </p>
                          <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Save ${monthlySavings}/year
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    <ul className="space-y-2 text-left mb-6">
                      {plan.features?.slice(0, 6).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                      {plan.features?.length > 6 && (
                        <li className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                          +{plan.features.length - 6} more features
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className={`w-full ${plan.is_popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                      variant={plan.is_popular ? 'default' : 'outline'}
                      onClick={() => handleUpgrade(plan)}
                      disabled={planIsCurrent || checkoutLoading === plan.id}
                    >
                      {checkoutLoading === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {planIsCurrent ? 'Current Plan' : price === 0 ? 'Get Started' : 'Upgrade'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meetings Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Used this month</span>
                    <span className="font-medium">{usage?.meetings?.used || 0} / {formatLimit(usage?.meetings?.limit)}</span>
                  </div>
                  <Progress value={usage?.meetings?.limit === -1 ? 0 : ((usage?.meetings?.used || 0) / (usage?.meetings?.limit || 5)) * 100} className="h-3" />
                  <p className="text-xs text-gray-500">Resets on the 1st of each month</p>
                </div>
              </CardContent>
            </Card>

            {/* Transcription Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  Transcription Minutes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Used this month</span>
                    <span className="font-medium">{usage?.transcription_minutes?.used || 0} / {formatLimit(usage?.transcription_minutes?.limit)} min</span>
                  </div>
                  <Progress value={usage?.transcription_minutes?.limit === -1 ? 0 : ((usage?.transcription_minutes?.used || 0) / (usage?.transcription_minutes?.limit || 30)) * 100} className="h-3" />
                  <p className="text-xs text-gray-500">Resets on the 1st of each month</p>
                </div>
              </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Cloud Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Currently using</span>
                    <span className="font-medium">{usage?.storage_gb?.used || 0} / {formatLimit(usage?.storage_gb?.limit)} GB</span>
                  </div>
                  <Progress value={((usage?.storage_gb?.used || 0) / (usage?.storage_gb?.limit || 1)) * 100} className="h-3" />
                  <p className="text-xs text-gray-500">Includes files, recordings, and transcriptions</p>
                </div>
              </CardContent>
            </Card>

            {/* Team Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  Team & Workspaces
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Workspaces</span>
                    <span className="font-medium">{usage?.workspaces?.used || 1} / {formatLimit(usage?.workspaces?.limit)}</span>
                  </div>
                  <Progress value={usage?.workspaces?.limit === -1 ? 0 : ((usage?.workspaces?.used || 1) / (usage?.workspaces?.limit || 1)) * 100} className="h-3" />
                  <div className="flex justify-between text-sm mt-4">
                    <span className="text-gray-600 dark:text-gray-400">Team Members</span>
                    <span className="font-medium">{usage?.team_members?.used || 1} / {formatLimit(usage?.team_members?.limit)}</span>
                  </div>
                  <Progress value={usage?.team_members?.limit === -1 ? 0 : ((usage?.team_members?.used || 1) / (usage?.team_members?.limit || 1)) * 100} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage warning */}
          {usage && (usage.meetings?.used / usage.meetings?.limit > 0.8 || usage.transcription_minutes?.used / usage.transcription_minutes?.limit > 0.8) && (
            <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                You are approaching your usage limits. Consider upgrading your plan for uninterrupted service.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserPlansPage;
