
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, ChevronRight, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { paymentGatewayService } from '@/services/paymentGatewayService';
import { paymentUIService } from '@/services/paymentUIService';
import { Separator } from '@/components/ui/separator';

const UserPaymentCheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Review, 2: Method, 3: Confirm, 4: Success
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  
  // Mock Invoice Data - in real app would come from route params or context
  const invoice = {
    id: 'INV-2023-001',
    amount: 299.00,
    currency: 'USD',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    items: [
      { desc: 'Pro Plan Subscription (Yearly)', amount: 249.00 },
      { desc: 'Additional Storage (50GB)', amount: 50.00 }
    ],
    tax: 0
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleProcessPayment = async () => {
    setLoading(true);
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success
      setStep(4);
      toast({ title: "Payment Successful", description: `Transaction ID: txn_${Math.random().toString(36).substr(2, 9)}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Payment Failed", description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Checkout | Munal</title>
      </Helmet>
      
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-500">
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
           <ShieldCheck className="w-5 h-5 text-green-600" />
           <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Secure Checkout</span>
        </div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-3xl overflow-hidden shadow-xl border-t-4 border-t-indigo-600">
        
        {/* Step Progress */}
        {step < 4 && (
          <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex justify-center items-center space-x-4 text-sm">
               <span className={`font-bold ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>1. Review</span>
               <ChevronRight className="w-4 h-4 text-gray-300" />
               <span className={`font-bold ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>2. Payment</span>
               <ChevronRight className="w-4 h-4 text-gray-300" />
               <span className={`font-bold ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>3. Confirm</span>
            </div>
          </div>
        )}

        <CardContent className="p-8 min-h-[400px]">
          {/* STEP 1: REVIEW */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <p className="text-gray-500 uppercase text-xs tracking-wider font-semibold">Total Amount Due</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                  {paymentUIService.formatCurrency(invoice.amount, invoice.currency)}
                </h1>
                <p className="text-sm text-red-500 mt-2 font-medium bg-red-50 inline-block px-3 py-1 rounded-full">
                  Due by {paymentUIService.formatDate(invoice.dueDate)}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 space-y-4">
                 <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2 mb-2">Invoice Summary</h3>
                 {invoice.items.map((item, idx) => (
                   <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{item.desc}</span>
                      <span className="font-medium">{paymentUIService.formatCurrency(item.amount)}</span>
                   </div>
                 ))}
                 <Separator />
                 <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span>{paymentUIService.formatCurrency(invoice.amount)}</span>
                 </div>
              </div>
            </div>
          )}

          {/* STEP 2: METHOD */}
          {step === 2 && (
            <div className="space-y-6">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Select Payment Method</h2>
               
               <RadioGroup defaultValue="stripe" value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-4">
                 <div className={`flex items-center space-x-4 border-2 p-4 rounded-xl cursor-pointer transition-all ${selectedMethod === 'stripe' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200'}`}>
                   <RadioGroupItem value="stripe" id="stripe" />
                   <Label htmlFor="stripe" className="flex-1 flex items-center justify-between cursor-pointer">
                     <div className="flex items-center gap-3">
                       <CreditCard className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                       <div>
                         <p className="font-bold">Credit / Debit Card</p>
                         <p className="text-xs text-gray-500">Secure payment via Stripe</p>
                       </div>
                     </div>
                     <div className="flex gap-1">
                       {/* Brand Icons placeholders */}
                       <div className="w-8 h-5 bg-gray-200 rounded"></div>
                       <div className="w-8 h-5 bg-gray-200 rounded"></div>
                     </div>
                   </Label>
                 </div>

                 <div className={`flex items-center space-x-4 border-2 p-4 rounded-xl cursor-pointer transition-all ${selectedMethod === 'paypal' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200'}`}>
                   <RadioGroupItem value="paypal" id="paypal" />
                   <Label htmlFor="paypal" className="flex-1 flex items-center gap-3 cursor-pointer">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">P</div>
                      <div>
                         <p className="font-bold">PayPal</p>
                         <p className="text-xs text-gray-500">Fast and secure checkout</p>
                      </div>
                   </Label>
                 </div>
               </RadioGroup>

               <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm rounded-lg flex gap-3 items-start">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <p>Your payment details will be processed securely. We do not store your full card details on our servers.</p>
               </div>
            </div>
          )}

          {/* STEP 3: CONFIRM */}
          {step === 3 && (
            <div className="space-y-8 text-center">
               <h2 className="text-2xl font-bold">Confirm Payment</h2>
               <p className="text-gray-500">Please review your order before processing.</p>
               
               <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl inline-block w-full max-w-md mx-auto border border-indigo-100 dark:border-indigo-800">
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-xl">{paymentUIService.formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium capitalize">{selectedMethod}</span>
                  </div>
                  <Separator className="my-4" />
                  <p className="text-xs text-gray-400">
                    By clicking "Pay Now", you agree to our Terms of Service and authorize this transaction.
                  </p>
               </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
             <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Successful!</h1>
                <p className="text-gray-500 max-w-md text-center">
                  Thank you for your payment. Your transaction has been completed successfully and a receipt has been emailed to you.
                </p>
                <div className="flex gap-4 pt-4">
                   <Button variant="outline" onClick={() => navigate('/user/payment-history')}>View Receipt</Button>
                   <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
                </div>
             </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        {step < 4 && (
          <CardFooter className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 p-6 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            ) : (
              <div></div> 
            )}
            
            {step < 3 ? (
              <Button onClick={handleNext} className="px-8">
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleProcessPayment} disabled={loading} className="px-8 bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Pay {paymentUIService.formatCurrency(invoice.amount)}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
      
      <div className="mt-8 flex gap-6 grayscale opacity-50">
         {/* Trust Badges Placeholders */}
         <div className="text-xs text-gray-400">Powered by Stripe</div>
         <div className="text-xs text-gray-400">256-bit SSL Encryption</div>
         <div className="text-xs text-gray-400">PCI Compliant</div>
      </div>
    </div>
  );
};

export default UserPaymentCheckoutPage;
