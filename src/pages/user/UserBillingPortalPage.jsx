
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { CreditCard, Zap, BarChart3, Settings, AlertTriangle } from 'lucide-react';
import { useUserBilling } from '@/hooks/useUserBilling';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import PageTransition from '@/components/PageTransition';
import BillingHistoryTable from '@/components/billing/BillingHistoryTable';
import { SubscriptionUpgradeModal, SubscriptionDowngradeModal } from '@/components/billing/SubscriptionModals';
import { useToast } from '@/components/ui/use-toast';
import { notificationService } from '@/services/notificationService'; // Added import

const UserBillingPortalPage = () => {
  const { plan, usage, billingHistory, loading, upgradeSubscription } = useUserBilling();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const { toast } = useToast();

  // Clear billing notifications when viewing the billing portal
  useEffect(() => {
    notificationService.markTypeAsRead('billing');
    notificationService.markTypeAsRead('plan_limit');
  }, []);

  const handlePlanChange = async (planId) => {
    try {
      await upgradeSubscription(planId);
      toast({
        title: "Plan Updated",
        description: `Successfully switched to ${planId === 'plan_free' ? 'Free' : 'Pro/Enterprise'} plan.`
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading billing information...</div>;
  }

  // Calculate percentages
  const getPercent = (used, limit) => {
    if (limit === -1 || limit > 99999) return 1; // Almost 0% for display
    if (!limit) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const isPro = plan?.id !== 'plan_free';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 lg:p-8">
      <Helmet>
        <title>Billing & Usage | Munal</title>
      </Helmet>

      <PageTransition>
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
            <p className="text-gray-500 mt-2">Manage your plan, view usage, and access invoices.</p>
          </div>

          {/* Current Plan Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-indigo-100 dark:border-indigo-900 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Current Plan: <span className="text-indigo-600">{plan?.name}</span></CardTitle>
                    <CardDescription className="mt-1">{plan?.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${plan?.price?.monthly}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                    {isPro && <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded inline-block mt-1">Active</div>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="flex flex-wrap gap-4">
                  {isPro ? (
                     <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>Change Plan</Button>
                  ) : (
                     <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowUpgradeModal(true)}>
                       <Zap className="w-4 h-4 mr-2 fill-current" /> Upgrade to Pro
                     </Button>
                  )}
                  {isPro && (
                    <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setShowDowngradeModal(true)}>
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Mini Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-500" /> Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPro ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                    <div>
                      <p className="text-sm font-medium">•••• 4242</p>
                      <p className="text-xs text-gray-500">Expires 12/28</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No payment method on file.</p>
                )}
              </CardContent>
              <CardFooter>
                 <Button variant="link" className="px-0 h-auto text-indigo-600">Manage Payment Methods</Button>
              </CardFooter>
            </Card>
          </div>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> Usage This Month
              </CardTitle>
              <CardDescription>
                Resets on {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metric 1 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Transcriptions</span>
                  <span className="text-gray-500">{usage?.transcriptions || 0} / {plan?.limits?.transcriptions === -1 ? '∞' : plan?.limits?.transcriptions}</span>
                </div>
                <Progress value={getPercent(usage?.transcriptions, plan?.limits?.transcriptions)} className="h-2" />
              </div>

              {/* Metric 2 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Audio Minutes</span>
                  <span className="text-gray-500">{usage?.audioMinutes || 0} / {plan?.limits?.audioMinutes === -1 ? '∞' : plan?.limits?.audioMinutes} min</span>
                </div>
                <Progress value={getPercent(usage?.audioMinutes, plan?.limits?.audioMinutes)} className="h-2" />
              </div>

              {/* Metric 3 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Storage Used</span>
                  <span className="text-gray-500">{usage?.storageGB || 0} / {plan?.limits?.storageGB === -1 ? '∞' : plan?.limits?.storageGB} GB</span>
                </div>
                <Progress value={getPercent(usage?.storageGB, plan?.limits?.storageGB)} className="h-2" />
              </div>

              {!isPro && getPercent(usage?.transcriptions, plan?.limits?.transcriptions) > 80 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>You are approaching your plan limits. Upgrade to Pro for increased capacity.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing History</h2>
            <BillingHistoryTable history={billingHistory} />
          </div>

        </div>
      </PageTransition>

      <SubscriptionUpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        currentPlanId={plan?.id}
        onUpgrade={handlePlanChange}
      />

      <SubscriptionDowngradeModal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        currentPlanId={plan?.id}
        onDowngrade={handlePlanChange}
      />
    </div>
  );
};

export default UserBillingPortalPage;
