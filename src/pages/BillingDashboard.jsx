
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import { subscriptionService } from '@/services/subscriptionService';
import { invoiceService } from '@/services/invoiceService';
import { getPlanById } from '@/config/subscriptionPlans';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';
import InvoiceTable from '@/components/shared/InvoiceTable';
import { useInvoiceActions } from '@/hooks/useInvoiceActions';
import { InvoiceActionModals } from '@/components/shared/InvoiceActionModals';

const BillingDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data fetching logic wrapped in function for reuse
  const fetchBillingData = async () => {
    if (user) {
      try {
        const sub = await subscriptionService.getUserSubscription(user.id);
        const inv = await invoiceService.getUserInvoices(user.id);
        setSubscription(sub);
        setInvoices(inv);
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load billing data.", variant: "destructive" });
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchBillingData();
      setLoading(false);
    };
    init();
  }, [user]);

  // Integrate the actions hook with the refresh callback
  const { 
    loading: actionLoading,
    activeModal, 
    selectedInvoice, 
    openModal, 
    closeModal, 
    executeAction 
  } = useInvoiceActions(fetchBillingData);

  // Determine what the modal should do on confirm
  const handleModalConfirm = (payload) => {
    if (!selectedInvoice || !activeModal) return;
    executeAction(activeModal, selectedInvoice, payload);
  };

  const handleActionClick = (action, invoice) => {
    if (['delete', 'markPaid', 'email', 'edit'].includes(action)) {
      openModal(action, invoice);
    } else {
      executeAction(action, invoice);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    if (confirm("Are you sure you want to cancel? You will lose access to premium features at the end of the billing period.")) {
      try {
        await subscriptionService.cancelSubscription(subscription.id);
        fetchBillingData();
        toast({ title: "Subscription Cancelled", description: "Your subscription has been cancelled." });
      } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Could not cancel subscription." });
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  const currentPlan = subscription ? getPlanById(subscription.planId) : null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary flex flex-col">
        <Helmet>
          <title>Billing & Subscription - Munal</title>
        </Helmet>
        
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
          <h1 className="text-3xl font-bold text-text-primary">Billing & Subscription</h1>

          {/* Current Plan Card */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-card to-indigo-950/10">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-indigo-500">{currentPlan?.name || 'Free'} Plan</h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${subscription?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {subscription?.status?.toUpperCase() || 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-text-secondary">
                    {subscription?.currentPeriodEnd 
                      ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : 'No active renewal'}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {subscription?.status === 'active' && currentPlan?.id !== 'plan_free' ? (
                    <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={handleCancelSubscription}>
                      Cancel Subscription
                    </Button>
                  ) : null}
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.location.href='/pricing'}>
                    {currentPlan?.id === 'plan_free' ? 'Upgrade Plan' : 'Change Plan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <CreditCard className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-xs text-text-secondary">Expires 12/2028</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-text-secondary">
                  <p className="font-medium text-text-primary">{user?.full_name || 'User Name'}</p>
                  <p>123 Startup Avenue</p>
                  <p>San Francisco, CA 94105</p>
                  <p>United States</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" /> Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceTable 
                invoices={invoices} 
                onAction={handleActionClick} 
              />
            </CardContent>
          </Card>

          {/* Action Modals */}
          <InvoiceActionModals 
            activeModal={activeModal}
            invoice={selectedInvoice}
            onClose={closeModal}
            onConfirm={handleModalConfirm}
            loading={actionLoading}
          />
        </main>
      </div>
    </PageTransition>
  );
};

export default BillingDashboard;
