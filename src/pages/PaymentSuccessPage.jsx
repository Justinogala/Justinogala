import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  
  const [status, setStatus] = useState('loading'); // loading, success, failed
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setStatus('failed');
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments/status/${sessionId}`);
      const data = await response.json();
      
      setPaymentData(data);
      
      if (data.payment_status === 'paid') {
        setStatus('success');
      } else if (data.status === 'expired') {
        setStatus('failed');
      } else {
        // Keep polling if still pending
        setTimeout(checkPaymentStatus, 3000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              {status === 'loading' && (
                <>
                  <Loader2 className="w-16 h-16 mx-auto mb-6 text-indigo-500 animate-spin" />
                  <h1 className="text-2xl font-bold mb-2">Processing Payment...</h1>
                  <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-500" />
                  </motion.div>
                  <h1 className="text-3xl font-bold mb-2 text-green-600">Payment Successful!</h1>
                  <p className="text-muted-foreground mb-6">
                    Thank you for your subscription. Your account has been upgraded.
                  </p>
                  
                  {paymentData?.amount_total && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="text-2xl font-bold">
                        ${(paymentData.amount_total / 100).toFixed(2)} {paymentData.currency?.toUpperCase()}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full h-12" 
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}

              {status === 'failed' && (
                <>
                  <XCircle className="w-20 h-20 mx-auto mb-6 text-red-500" />
                  <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h1>
                  <p className="text-muted-foreground mb-6">
                    We couldn't process your payment. Please try again.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => navigate('/pricing')}
                    >
                      Try Again
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => navigate('/')}
                    >
                      Go Home
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
