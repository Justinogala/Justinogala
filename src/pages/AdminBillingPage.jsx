
import React, { useEffect, useState } from 'react';
import { getPlans, getInvoices, getBillingStats, updatePlan } from '@/services/adminBillingService';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Edit2, Download, CreditCard, TrendingUp } from 'lucide-react';
import AdminTable from '@/components/AdminTable';
import { useToast } from '@/components/ui/use-toast';

const PlanCard = ({ plan, onEdit }) => (
  <Card className="bg-slate-900 border-white/10 relative overflow-hidden">
    <div className={`absolute top-0 left-0 w-full h-1 ${plan.id === 'business' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} />
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
          <CardDescription className="text-2xl font-bold text-white mt-2">${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></CardDescription>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onEdit(plan)}><Edit2 className="w-4 h-4" /></Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="text-sm text-gray-400 flex justify-between">
        <span>Transcription</span>
        <span className="text-white">{plan.limits.transcription} mins</span>
      </div>
      <div className="text-sm text-gray-400 flex justify-between">
        <span>Storage</span>
        <span className="text-white">{plan.limits.storage} GB</span>
      </div>
      <div className="text-sm text-gray-400 flex justify-between">
        <span>Members</span>
        <span className="text-white">{plan.limits.members}</span>
      </div>
      <div className="pt-4 border-t border-white/5 space-y-1">
        {Object.entries(plan.features).map(([key, val]) => (
          <div key={key} className={`text-xs flex items-center gap-2 ${val ? 'text-green-400' : 'text-gray-600'}`}>
            <Check className="w-3 h-3" /> {key.charAt(0).toUpperCase() + key.slice(1)}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const AdminBillingPage = () => {
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getPlans(), getInvoices(), getBillingStats()])
      .then(([p, i, s]) => {
        setPlans(p);
        setInvoices(i.invoices);
        setStats(s);
        setLoading(false);
      });
  }, []);

  const handleEditPlan = (plan) => {
    // In a real app, open modal. Here just a toast for simplicity as per requirements focused on other modals
    toast({ description: `Editing ${plan.name} configuration... (Modal placeholder)` });
  };

  const columns = [
    { key: 'id', label: 'Invoice ID', render: (i) => <span className="font-mono text-xs text-gray-400">#{i.id.split('_')[1]}</span> },
    { key: 'userEmail', label: 'Customer', render: (i) => <span className="text-sm text-white">{i.userEmail}</span> },
    { key: 'plan', label: 'Plan', render: (i) => <Badge variant="outline">{i.plan}</Badge> },
    { key: 'amount', label: 'Amount', render: (i) => <span className="text-white font-medium">${i.amount.toFixed(2)}</span> },
    { key: 'date', label: 'Date', render: (i) => <span className="text-xs text-gray-400">{new Date(i.date).toLocaleDateString()}</span> },
    { key: 'status', label: 'Status', render: (i) => (
      <Badge className={i.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
        {i.status}
      </Badge>
    )},
    { key: 'action', label: '', render: () => (
      <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><Download className="w-3 h-3" /></Button>
    )}
  ];

  if (loading) return <div className="text-white p-8">Loading billing data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Billing & Subscriptions</h1>
        <Badge variant="outline" className="border-green-500 text-green-400 gap-2 px-3 py-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Stripe Connected
        </Badge>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase">MRR</p>
            <p className="text-2xl font-bold text-white">${stats.mrr.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-white/10">
           <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase">Active Subs</p>
            <p className="text-2xl font-bold text-white">{stats.activeSubs}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-white/10">
           <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase">Churn Rate</p>
            <p className="text-2xl font-bold text-red-400">{stats.churnRate}%</p>
          </CardContent>
        </Card>
         <Card className="bg-slate-900/50 border-white/10">
           <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase">Avg LTV</p>
            <p className="text-2xl font-bold text-green-400">${stats.ltv}</p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Config */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={handleEditPlan} />
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Invoices</h2>
        <AdminTable columns={columns} data={invoices} isLoading={false} />
      </div>
    </div>
  );
};

export default AdminBillingPage;
