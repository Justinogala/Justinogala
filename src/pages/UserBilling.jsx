
import React from 'react';
import { motion } from 'framer-motion';
import SubscriptionStatus from '@/components/shared/SubscriptionStatus';
import BillingCard from '@/components/shared/BillingCard';
import InvoiceTable from '@/components/shared/InvoiceTable';
import PaymentMethodCard from '@/components/shared/PaymentMethodCard';
import PlanComparison from '@/components/shared/PlanComparison';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const UserBilling = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
            <p className="text-gray-500 mt-1">Manage your plan, payment methods, and invoices</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
               <SubscriptionStatus 
                 plan="Pro Plan"
                 status="active"
                 nextBillingDate="2023-12-01"
                 amount="19.00"
               />
            </div>
            <div className="md:col-span-1 space-y-4">
               <BillingCard 
                 title="Storage Used"
                 value="45 GB"
                 subtext="of 100 GB"
               />
               <BillingCard 
                 title="Transcription Hours"
                 value="12.5 hrs"
                 subtext="Unlimited"
               />
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="plans">Available Plans</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
               <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                 <h2 className="text-lg font-semibold mb-4">Recent Invoices</h2>
                 <InvoiceTable invoices={[
                    { id: 'INV-2023-001', date: '2023-11-01', amount: 19.00, status: 'Paid' },
                    { id: 'INV-2023-002', date: '2023-10-01', amount: 19.00, status: 'Paid' },
                 ]} />
               </div>
            </TabsContent>

            <TabsContent value="plans">
               <PlanComparison currentPlan="Pro" onUpgrade={() => {}} />
            </TabsContent>

            <TabsContent value="payment">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h2 className="text-lg font-semibold">Payment Methods</h2>
                   <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Method</Button>
                </div>
                <PaymentMethodCard 
                  type="visa"
                  last4="4242"
                  expiry="12/24"
                  isDefault={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="invoices">
              <InvoiceTable invoices={[
                 { id: 'INV-2023-001', date: '2023-11-01', amount: 19.00, status: 'Paid' },
                 { id: 'INV-2023-002', date: '2023-10-01', amount: 19.00, status: 'Paid' },
                 { id: 'INV-2023-003', date: '2023-09-01', amount: 19.00, status: 'Paid' },
              ]} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserBilling;
