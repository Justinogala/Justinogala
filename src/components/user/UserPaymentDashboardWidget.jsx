
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, DollarSign, Clock, Wallet } from 'lucide-react';
import { paymentTransactionService } from '@/services/paymentTransactionService';
import { paymentUIService } from '@/services/paymentUIService';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const UserPaymentDashboardWidget = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const allTxns = paymentTransactionService.getTransactionHistory(); 
      const calculatedStats = paymentUIService.calculateStats(allTxns);
      setStats(calculatedStats);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <Skeleton className="h-[200px] w-full rounded-2xl" />;
  }

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
               <Wallet className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-gray-900 dark:text-white">Payment & Billing</h3>
             </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/billing')} className="text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-full">
            Details
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
               <Clock className="w-3.5 h-3.5" />
               <span className="text-xs font-medium uppercase tracking-wide">Pending</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
               {paymentUIService.formatCurrency(stats?.pendingAmount || 0)}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
               <DollarSign className="w-3.5 h-3.5" />
               <span className="text-xs font-medium uppercase tracking-wide">Total Paid</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
               {paymentUIService.formatCurrency(stats?.totalPaid || 0)}
            </p>
          </div>
        </div>
        
        <div className="mt-auto">
          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-0 rounded-xl py-5"
            onClick={() => navigate('/user/checkout')}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Make a Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserPaymentDashboardWidget;
