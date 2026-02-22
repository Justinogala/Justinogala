import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Users, ArrowUpRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BillingCard from '@/components/shared/BillingCard';
import InvoiceTable from '@/components/shared/InvoiceTable';
import BillingChart from '@/components/shared/BillingChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { calculateRevenue } from '@/services/billingService';
import ExportDataModal from '@/components/admin/modals/ExportDataModal';

const AdminBilling = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setTimeout(async () => {
        const revenue = await calculateRevenue();
        setStats(revenue);
        setLoading(false);
      }, 800);
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Billing & Revenue</h1>
        <Button onClick={() => setIsExportModalOpen(true)} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export Data
        </Button>
      </div>

      <ExportDataModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        initialType="Billing" 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BillingCard
          title="Total Revenue"
          value={`$${stats.total.toLocaleString()}`}
          trend={stats.growth}
          icon={DollarSign}
        />
        <BillingCard
          title="Active Subscriptions"
          value="1,245"
          subtext="+180 from last month"
          icon={Users}
        />
        <BillingCard
          title="Avg. Revenue / User"
          value="$42.50"
          subtext="+4% from last month"
          icon={ArrowUpRight}
        />
         <BillingCard
          title="Pending Invoices"
          value="23"
          subtext="Amount: $4,200"
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
          <BillingChart data={stats.history} />
        </div>
        <div className="col-span-3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
           <h3 className="text-lg font-semibold mb-4">Subscription Distribution</h3>
           <div className="space-y-4">
             {['Pro Plan (65%)', 'Team Plan (25%)', 'Enterprise (10%)'].map((item, i) => (
               <div key={i} className="flex items-center justify-between">
                 <span className="text-sm font-medium">{item}</span>
                 <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500" 
                     style={{ width: ['65%', '25%', '10%'][i] }} 
                   />
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <Tabs defaultValue="invoices">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="invoices">Recent Transactions</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Input placeholder="Search user or invoice..." className="w-[250px]" />
            </div>
          </div>
          <TabsContent value="invoices">
             <InvoiceTable invoices={[
               { id: 'INV-001', date: '2023-11-01', amount: 29.00, status: 'Paid', user_id: '1' },
               { id: 'INV-002', date: '2023-11-02', amount: 99.00, status: 'Paid', user_id: '2' },
               { id: 'INV-003', date: '2023-11-03', amount: 29.00, status: 'Failed', user_id: '3' },
             ]} />
          </TabsContent>
          <TabsContent value="pending">
             <div className="py-8 text-center text-gray-500">No pending invoices.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBilling;