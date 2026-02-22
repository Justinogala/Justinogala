
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CreditCard, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { paymentGatewayService } from '@/services/paymentGatewayService';
import { paymentTransactionService } from '@/services/paymentTransactionService';

const PaymentCheckoutModal = ({ isOpen, onClose, invoice, onSuccess }) => {
  const { toast } = useToast();
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('select'); // select, processing, success, error

  useEffect(() => {
    if (isOpen) {
      const active = paymentGatewayService.getGateways().filter(g => g.status === 'active');
      setGateways(active);
      if (active.length > 0) setSelectedGateway(active[0].id);
      setStep('select');
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!selectedGateway) return;
    
    setStep('processing');
    setLoading(true);

    try {
      // Create transaction record
      const transaction = paymentTransactionService.createTransaction(
        invoice.id, 
        selectedGateway, 
        invoice.amount, 
        'USD', 
        'current-user-id' // Placeholder
      );

      // Process
      await paymentGatewayService.processPayment(selectedGateway, {
        amount: invoice.amount,
        invoiceId: invoice.id
      });

      // Update Transaction
      paymentTransactionService.updateTransactionStatus(transaction.id, 'completed', { success: true });
      
      setStep('success');
      setTimeout(() => {
        onSuccess(transaction);
        onClose();
      }, 2000);

    } catch (error) {
      setStep('error');
      toast({ variant: "destructive", title: "Payment Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  const currentGateway = gateways.find(g => g.id === selectedGateway);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-white text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-2 bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold">Secure Payment</h2>
            <p className="text-indigo-100 text-sm">Invoice #{invoice.id}</p>
          </div>

          <div className="p-6">
            {step === 'select' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-slate-500 mb-1">Total Amount Due</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white">${invoice.amount.toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Payment Method</p>
                  {gateways.map(gw => (
                    <label 
                      key={gw.id} 
                      className={`
                        flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all
                        ${selectedGateway === gw.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="gateway" 
                          value={gw.id} 
                          checked={selectedGateway === gw.id}
                          onChange={() => setSelectedGateway(gw.id)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="font-medium">{gw.name}</span>
                      </div>
                      <img src={gw.logo} alt={gw.name} className="h-6 object-contain" />
                    </label>
                  ))}
                </div>
                
                {currentGateway && (
                   <p className="text-xs text-center text-slate-500">
                     Includes {currentGateway.config.transactionFee}% transaction fee
                   </p>
                )}

                <Button className="w-full h-12 text-lg" onClick={handlePayment}>
                  Pay Now
                </Button>
              </div>
            )}

            {step === 'processing' && (
              <div className="py-10 text-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto" />
                <h3 className="text-xl font-bold">Processing Payment...</h3>
                <p className="text-slate-500">Please do not close this window.</p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-600">Payment Successful!</h3>
                <p className="text-slate-500">Redirecting...</p>
              </div>
            )}
            
            {step === 'error' && (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                   <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-red-600">Payment Failed</h3>
                <Button variant="outline" onClick={() => setStep('select')}>Try Again</Button>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
             Powered by Munal Secure Payments
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentCheckoutModal;
