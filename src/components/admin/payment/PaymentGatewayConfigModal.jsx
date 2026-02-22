
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Activity, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { paymentGatewayService } from '@/services/paymentGatewayService';

const PaymentGatewayConfigModal = ({ isOpen, onClose, gateway, onSave }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (gateway) {
      setConfig({ ...gateway.config });
      setTestResult(null);
    }
  }, [gateway]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(gateway.id, config);
      toast({ title: "Configuration saved", className: "bg-green-600 text-white" });
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to save", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await paymentGatewayService.testGatewayConnection(gateway.id);
      setTestResult(result);
      if (result.success) {
        toast({ title: "Connection Successful", className: "bg-green-600 text-white" });
      } else {
        toast({ variant: "destructive", title: "Connection Failed", description: result.message });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen || !gateway) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <img src={gateway.logo} alt={gateway.name} className="h-8 w-auto object-contain" />
              <h2 className="text-xl font-bold dark:text-white">Configure {gateway.name}</h2>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${gateway.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                <span className="font-medium dark:text-white">Status: {gateway.status.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Activity className="w-4 h-4" />
                Last tested: {gateway.lastTested ? new Date(gateway.lastTested).toLocaleDateString() : 'Never'}
              </div>
            </div>

            {/* Dynamic Fields based on Gateway */}
            <div className="space-y-4">
              {Object.keys(config).map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                  <Input 
                    id={key}
                    type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? "password" : "text"}
                    value={config[key]}
                    onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Test Connection Result */}
            {testResult && (
              <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${
                testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {testResult.success ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between">
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
              Test Connection
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentGatewayConfigModal;
