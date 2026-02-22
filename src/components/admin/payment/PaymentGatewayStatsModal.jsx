
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, DollarSign, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paymentGatewayService } from '@/services/paymentGatewayService';
import { Card, CardContent } from '@/components/ui/card';

const PaymentGatewayStatsModal = ({ isOpen, onClose, gateway }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen && gateway) {
      setStats(paymentGatewayService.getGatewayStatistics(gateway.id));
    }
  }, [isOpen, gateway]);

  if (!isOpen || !gateway) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <img src={gateway.logo} alt={gateway.name} className="h-6 w-6 object-contain" />
              </div>
              <h2 className="text-xl font-bold dark:text-white">Statistics: {gateway.name}</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {stats && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                          <h3 className="text-2xl font-bold mt-1">${stats.totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
                          <DollarSign className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Transactions</p>
                          <h3 className="text-2xl font-bold mt-1">{stats.totalTransactions}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                          <Activity className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Success Rate</p>
                          <h3 className="text-2xl font-bold mt-1">{stats.successRate}%</h3>
                        </div>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Simple Chart Visualization (CSS based for simplicity in simulation) */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Transaction Volume (Last 30 Days)</h3>
                  <div className="h-48 flex items-end gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {stats.volumeData.map((d, i) => (
                      <div 
                        key={i} 
                        className="bg-indigo-500/80 hover:bg-indigo-600 transition-all rounded-t w-full"
                        style={{ height: `${(d.amount / 1000) * 100}%` }}
                        title={`${d.date}: $${d.amount}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>30 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentGatewayStatsModal;
