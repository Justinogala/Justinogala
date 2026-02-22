
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ShieldCheck, Settings, BarChart2, List, Power, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { paymentGatewayService } from '@/services/paymentGatewayService';

// Modals
import PaymentGatewayConfigModal from '@/components/admin/payment/PaymentGatewayConfigModal';
import PaymentGatewayStatsModal from '@/components/admin/payment/PaymentGatewayStatsModal';
import PaymentGatewayTransactionLogsModal from '@/components/admin/payment/PaymentGatewayTransactionLogsModal';

const AdminPaymentGatewaysPage = () => {
  const { toast } = useToast();
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ status: 'unknown', details: '' });
  
  // Modal States
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    // Simulate network
    setTimeout(() => {
      setGateways(paymentGatewayService.getGateways());
      setHealth(paymentGatewayService.getGatewayHealth());
      setLoading(false);
    }, 600);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleGateway = (id, currentStatus) => {
    const isEnabled = currentStatus === 'active';
    let result;
    if (isEnabled) {
      result = paymentGatewayService.disableGateway(id);
      toast({ title: "Gateway Disabled", description: "Payment processing stopped for this gateway." });
    } else {
      result = paymentGatewayService.enableGateway(id);
      toast({ title: "Gateway Enabled", description: "Gateway is now active.", className: "bg-green-600 text-white" });
    }
    
    if (result.success) fetchData();
  };

  const handleSaveConfig = (id, newConfig) => {
    const result = paymentGatewayService.updateGateway(id, { config: newConfig });
    if (result.success) {
      fetchData();
    }
  };

  const openConfig = (gw) => { setSelectedGateway(gw); setConfigModalOpen(true); };
  const openStats = (gw) => { setSelectedGateway(gw); setStatsModalOpen(true); };
  const openLogs = (gw) => { setSelectedGateway(gw); setLogsModalOpen(true); };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Helmet>
        <title>Payment Gateways | Admin</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
            Payment Gateways
          </h1>
          <p className="text-slate-500 mt-1">Manage and configure payment providers for your platform.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${health.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-sm font-medium dark:text-white">{health.details}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={fetchData}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Grid of Gateways */}
      {loading && gateways.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gateways.map((gw, index) => (
            <motion.div
              key={gw.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative bg-white dark:bg-slate-900 rounded-xl border-2 transition-all duration-300
                ${gw.enabled ? 'border-indigo-600/20 shadow-lg shadow-indigo-500/5' : 'border-slate-200 dark:border-slate-800 opacity-80'}
              `}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-start">
                <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-white p-3 flex items-center justify-center border border-slate-100">
                  <img src={gw.logo} alt={gw.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                    ${gw.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    ${gw.status === 'inactive' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : ''}
                    ${gw.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                  `}>
                    {gw.status}
                  </span>
                  <Switch 
                    checked={gw.enabled} 
                    onCheckedChange={() => handleToggleGateway(gw.id, gw.status)}
                  />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Transaction Fee</span>
                  <span className="font-mono font-medium">{gw.config.transactionFee}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Last Tested</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {gw.lastTested ? new Date(gw.lastTested).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                
                {gw.status === 'error' && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Connection Failed. Check Settings.
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl grid grid-cols-3 gap-2">
                <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2" onClick={() => openConfig(gw)}>
                  <Settings className="w-4 h-4" />
                  <span className="text-[10px]">Configure</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2" onClick={() => openStats(gw)}>
                  <BarChart2 className="w-4 h-4" />
                  <span className="text-[10px]">Stats</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2" onClick={() => openLogs(gw)}>
                  <List className="w-4 h-4" />
                  <span className="text-[10px]">Logs</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <PaymentGatewayConfigModal 
        isOpen={configModalOpen} 
        onClose={() => setConfigModalOpen(false)} 
        gateway={selectedGateway}
        onSave={handleSaveConfig}
      />
      <PaymentGatewayStatsModal 
        isOpen={statsModalOpen} 
        onClose={() => setStatsModalOpen(false)} 
        gateway={selectedGateway}
      />
      <PaymentGatewayTransactionLogsModal 
        isOpen={logsModalOpen} 
        onClose={() => setLogsModalOpen(false)} 
        gateway={selectedGateway}
      />
    </div>
  );
};

export default AdminPaymentGatewaysPage;
