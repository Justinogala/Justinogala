import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

const UserPaymentCheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [status, setStatus] = useState('loading'); // loading, success, failed, cancelled
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const maxPollAttempts = 10;
  const pollInterval = 2000; // 2 seconds

  const sessionId = searchParams.get('session_id');
  const urlStatus = searchParams.get('status');

  useEffect(() => {
    if (urlStatus === 'cancelled') {
      setStatus('cancelled');
      return;
    }

    if (sessionId) {
      pollPaymentStatusFn(sessionId, 0);
    } else {
      setStatus('failed');
    }
  }, [sessionId, urlStatus]);

  const pollPaymentStatusFn = async (sid, attempt) => {
    if (attempt >= maxPollAttempts) {
      setStatus('timeout');
      toast({
        variant: "destructive",
        title: "Status Check Timeout",
        description: "Payment status check timed out. Please check your email for confirmation."
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments/status/${sid}`);
      
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      setPaymentDetails(data);

      if (data.payment_status === 'paid') {
        setStatus('success');
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!"
        });
        return;
      } else if (data.status === 'expired') {
        setStatus('expired');
        return;
      } else if (data.payment_status === 'unpaid' && data.status === 'open') {
        // Still processing, continue polling
        setPollAttempts(attempt + 1);
        setTimeout(() => pollPaymentStatusFn(sid, attempt + 1), pollInterval);
      } else {
        // Unknown status, show as pending
        setStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPollAttempts(attempt + 1);
      
      if (attempt + 1 < maxPollAttempts) {
        setTimeout(() => pollPaymentStatusFn(sid, attempt + 1), pollInterval);
      } else {
        setStatus('error');
      }
    }
  };

  const handleRetry = () => {
    if (sessionId) {
      setStatus('loading');
      setPollAttempts(0);
      pollPaymentStatusFn(sessionId, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4" data-testid="checkout-page">
      <Helmet>
        <title>Checkout | Munal</title>
      </Helmet>
      
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => navigate('/user/plans')} className="text-gray-500">
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Plans
        </Button>
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-5 h-5 text-green-600" />
           <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Secure Checkout</span>
        </div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-xl overflow-hidden shadow-xl">
        <CardContent className="p-8 min-h-[300px] flex flex-col items-center justify-center">
          
          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center space-y-4" data-testid="loading-state">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verifying Payment...</h2>
              <p className="text-gray-500">Please wait while we confirm your payment.</p>
              {pollAttempts > 0 && (
                <p className="text-sm text-gray-400">Attempt {pollAttempts} of {maxPollAttempts}</p>
              )}
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500" data-testid="success-state">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Successful!</h1>
              <p className="text-gray-500 max-w-md">
                Thank you for your purchase. Your subscription has been activated and a receipt has been emailed to you.
              </p>
              {paymentDetails && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">${(paymentDetails.amount_total / 100).toFixed(2)} {paymentDetails.currency?.toUpperCase()}</span>
                  </div>
                  {paymentDetails.metadata?.package_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plan:</span>
                      <span className="font-medium">{paymentDetails.metadata.package_name}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => navigate('/user/transactions')}>View Transactions</Button>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              </div>
            </div>
          )}

          {/* Cancelled State */}
          {status === 'cancelled' && (
            <div className="text-center space-y-6" data-testid="cancelled-state">
              <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Cancelled</h1>
              <p className="text-gray-500 max-w-md">
                Your payment was cancelled. No charges have been made to your account.
              </p>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => navigate('/user/plans')}>Back to Plans</Button>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              </div>
            </div>
          )}

          {/* Failed/Error State */}
          {(status === 'failed' || status === 'error') && (
            <div className="text-center space-y-6" data-testid="failed-state">
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Failed</h1>
              <p className="text-gray-500 max-w-md">
                We could not verify your payment. Please try again or contact support if the issue persists.
              </p>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
                <Button onClick={() => navigate('/user/plans')}>Back to Plans</Button>
              </div>
            </div>
          )}

          {/* Timeout State */}
          {status === 'timeout' && (
            <div className="text-center space-y-6" data-testid="timeout-state">
              <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Timeout</h1>
              <p className="text-gray-500 max-w-md">
                Payment verification is taking longer than expected. Please check your email for confirmation or try refreshing.
              </p>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
                <Button onClick={() => navigate('/user/transactions')}>Check Transactions</Button>
              </div>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div className="text-center space-y-6" data-testid="expired-state">
              <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Expired</h1>
              <p className="text-gray-500 max-w-md">
                Your checkout session has expired. Please start a new checkout to complete your purchase.
              </p>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate('/user/plans')}>Back to Plans</Button>
              </div>
            </div>
          )}

          {/* Pending State */}
          {status === 'pending' && (
            <div className="text-center space-y-6" data-testid="pending-state">
              <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-12 h-12 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Pending</h1>
              <p className="text-gray-500 max-w-md">
                Your payment is being processed. This may take a few moments.
              </p>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Check Status
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
      
      <div className="mt-8 flex gap-6 text-xs text-gray-400">
        <span>Powered by Stripe</span>
        <span>256-bit SSL Encryption</span>
        <span>PCI Compliant</span>
      </div>
    </div>
  );
};

export default UserPaymentCheckoutPage;
