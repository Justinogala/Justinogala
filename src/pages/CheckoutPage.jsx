import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Lock, CreditCard, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import PaymentMethod from '@/components/PaymentMethod';
import { getPlanById } from '@/config/subscriptionPlans';
import { PAYMENT_CONFIG } from '@/config/paymentConfig';
import { paymentService } from '@/services/paymentService';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/context/AuthContext';
import PageTransition from '@/components/PageTransition';

const CheckoutPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_CONFIG.PROVIDERS.STRIPE);
  const [coupon, setCoupon] = useState('');
  const [billingDetails, setBillingDetails] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    address: '',
    city: '',
    zip: ''
  });

  const plan = getPlanById(planId);

  useEffect(() => {
    if (!plan) {
      toast({ variant: "destructive", title: "Invalid Plan", description: "Plan not found." });
      navigate('/pricing');
    }
  }, [plan, navigate, toast]);

  if (!plan) return null;

  const subtotal = plan.price.USD;
  const tax = subtotal * PAYMENT_CONFIG.TAX.DEFAULT_RATE;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast({ title: "Authentication Required", description: "Please log in to complete purchase." });
      navigate('/login', { state: { from: `/checkout/${planId}` } });
      return;
    }

    setLoading(true);
    try {
      // 1. Create Payment Session/Order
      let paymentResult;
      if (selectedMethod === PAYMENT_CONFIG.PROVIDERS.STRIPE) {
        paymentResult = await paymentService.createStripeSession(planId, total, 'USD', user.id);
      } else {
        paymentResult = await paymentService.createRazorpayOrder(planId, total, 'INR', user.id);
      }

      // 2. Mock Payment Verification (In real app, user would be redirected or popup would open)
      const verifyResult = await paymentService.verifyPayment({
        userId: user.id,
        planId: planId,
        amount: total,
        currency: 'USD',
        provider: selectedMethod
      });

      if (verifyResult.success) {
        // 3. Create/Update Subscription
        await subscriptionService.createSubscription(user.id, planId, verifyResult.paymentRecord.id);
        
        toast({
          title: "Payment Successful!",
          description: `You are now subscribed to the ${plan.name} plan.`
        });
        navigate('/billing'); // Or success page
      } else {
        throw new Error("Payment verification failed");
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-secondary">
        <Helmet>
          <title>Checkout - Munal</title>
        </Helmet>
        
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Plans
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Billing & Payment */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Billing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Full Name" 
                      value={billingDetails.name} 
                      onChange={e => setBillingDetails({...billingDetails, name: e.target.value})}
                    />
                    <Input 
                      label="Email" 
                      value={billingDetails.email} 
                      disabled 
                      className="opacity-70"
                    />
                  </div>
                  <Input 
                    label="Address" 
                    placeholder="123 Main St"
                    value={billingDetails.address} 
                    onChange={e => setBillingDetails({...billingDetails, address: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="City" 
                      value={billingDetails.city} 
                      onChange={e => setBillingDetails({...billingDetails, city: e.target.value})}
                    />
                    <Input 
                      label="ZIP / Postal Code" 
                      value={billingDetails.zip} 
                      onChange={e => setBillingDetails({...billingDetails, zip: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-lg">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethod selected={selectedMethod} onSelect={setSelectedMethod} />
                  
                  <div className="mt-6 flex items-center p-4 bg-green-50/10 border border-green-500/20 rounded-lg text-sm text-green-600 dark:text-green-400">
                    <Lock className="w-4 h-4 mr-2" />
                    Payments are secure and encrypted.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-1">
              <Card className="border-indigo-500/30 bg-card/80 sticky top-24 shadow-xl">
                <CardHeader className="bg-indigo-500/5 border-b border-border">
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{plan.name} Plan</h3>
                      <p className="text-sm text-text-secondary">Billed {plan.interval}ly</p>
                    </div>
                    <span className="font-bold text-xl">${subtotal.toFixed(2)}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} className="flex items-center text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-green-500 mr-2" /> {f}
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Tax ({PAYMENT_CONFIG.TAX.DEFAULT_RATE * 100}%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border mt-2">
                      <span>Total</span>
                      <span className="text-indigo-500">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Coupon Code" 
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        className="h-10"
                      />
                      <Button variant="outline">Apply</Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pb-6">
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg shadow-lg shadow-indigo-500/20"
                    onClick={handleCheckout}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        Pay ${total.toFixed(2)}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default CheckoutPage;