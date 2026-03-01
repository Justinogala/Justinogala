import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Check, Zap, Star, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL;

const UserPlansPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  
  // Current plan data (could be fetched from backend)
  const currentPlan = {
    name: 'Free',
    price: 0,
    renewalDate: null,
    usage: {
      meetings: { used: 3, limit: 5 },
      storage: { used: 0.2, limit: 1 },
      transcriptions: { used: 15, limit: 30 }
    }
  };

  const plans = [
    {
      id: 'free',
      packageId: 'free',
      name: 'Free',
      icon: Zap,
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started',
      features: [
        '5 meetings per month',
        '30 min transcription',
        '1 GB cloud storage',
        'AI-powered transcription',
        'Instant video meetings',
        'Team chat messaging',
        'Calendar & scheduling',
        'Basic AI summaries'
      ],
      popular: false
    },
    {
      id: 'pro',
      packageId: isAnnual ? 'pro_annual' : 'pro_monthly',
      name: 'Pro',
      icon: Star,
      price: { monthly: 29, annual: 290 },
      description: 'For professionals & small teams',
      features: [
        '100 meetings per month',
        '500 min transcription',
        '10 GB cloud storage',
        'Advanced AI summaries',
        'Voice chat channels',
        'Text to audio conversion',
        'Up to 5 workspaces',
        'Up to 10 team members',
        'Meeting recording',
        'Priority support',
        'Basic analytics'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      packageId: isAnnual ? 'enterprise_annual' : 'enterprise_monthly',
      name: 'Enterprise',
      icon: Crown,
      price: { monthly: 99, annual: 990 },
      description: 'For large organizations',
      features: [
        'Unlimited meetings',
        'Unlimited transcription',
        '100 GB cloud storage',
        'All Pro features included',
        'Unlimited workspaces',
        'Unlimited team members',
        'Full admin dashboard',
        'Cloud storage config (S3, GCS, R2)',
        '24/7 dedicated support',
        'API access & integrations',
        'Data migration tools',
        'Role-based access control'
      ],
      popular: false
    }
  ];

  const handleUpgrade = async (plan) => {
    if (plan.price.monthly === 0) {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: plan.packageId,
          origin_url: window.location.origin,
          user_id: user?.id || null,
          user_email: user?.email || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      if (data.requires_payment === false) {
        toast({
          title: "Plan Activated",
          description: `${plan.name} plan is now active!`
        });
        return;
      }

      if (data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" data-testid="user-plans-page">
      <Helmet><title>Plans & Billing | Munal</title></Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plans & Billing</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and billing details</p>
      </div>

      {/* Current Plan Summary */}
      <Card className="mb-8 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan: {currentPlan.name}</CardTitle>
              <CardDescription>
                {currentPlan.renewalDate 
                  ? `Next billing date: ${new Date(currentPlan.renewalDate).toLocaleDateString()}`
                  : 'No active subscription'
                }
              </CardDescription>
            </div>
            <Badge className="bg-indigo-600 text-white">
              {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Meetings</span>
                <span className="font-medium">{currentPlan.usage.meetings.used}/{currentPlan.usage.meetings.limit}</span>
              </div>
              <Progress value={(currentPlan.usage.meetings.used / currentPlan.usage.meetings.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Storage</span>
                <span className="font-medium">{currentPlan.usage.storage.used}/{currentPlan.usage.storage.limit} GB</span>
              </div>
              <Progress value={(currentPlan.usage.storage.used / currentPlan.usage.storage.limit) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Transcriptions</span>
                <span className="font-medium">{currentPlan.usage.transcriptions.used}/{currentPlan.usage.transcriptions.limit} min</span>
              </div>
              <Progress value={(currentPlan.usage.transcriptions.used / currentPlan.usage.transcriptions.limit) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
        {currentPlan.price > 0 && (
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

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Label htmlFor="billing-toggle" className={!isAnnual ? "font-semibold" : "text-gray-500"}>Monthly</Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <Label htmlFor="billing-toggle" className={isAnnual ? "font-semibold" : "text-gray-500"}>
          Annual <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">Save 17%</Badge>
        </Label>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const planIsCurrent = isCurrent(plan.name);
          const price = isAnnual ? plan.price.annual : plan.price.monthly;
          const Icon = plan.icon;
          const isLoading = checkoutLoading === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-2 border-indigo-500 shadow-lg shadow-indigo-500/10' : ''} ${planIsCurrent ? 'ring-2 ring-green-500' : ''}`}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white px-3">Most Popular</Badge>
                </div>
              )}
              {planIsCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-600 text-white px-3">Current Plan</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-8">
                <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${plan.popular ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Icon className={`w-6 h-6 ${plan.popular ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">${price}</span>
                  <span className="text-gray-500">/{isAnnual ? 'year' : 'month'}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                  variant={planIsCurrent ? "outline" : "default"}
                  disabled={planIsCurrent || isLoading}
                  onClick={() => handleUpgrade(plan)}
                  data-testid={`select-plan-${plan.id}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : planIsCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      {plan.price.monthly === 0 ? 'Get Started' : 'Upgrade'} 
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UserPlansPage;
