import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Plus, Minus, Calendar, Crown, Check, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || '';

const TeamBillingCard = ({ workspaceId, ownerId, currentMemberCount = 1 }) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAnnual, setIsAnnual] = useState(true);
  const [seats, setSeats] = useState(Math.max(5, currentMemberCount));
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [priceCalculation, setPriceCalculation] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
  }, [workspaceId]);

  useEffect(() => {
    if (selectedPlan) {
      calculatePrice();
    }
  }, [selectedPlan, seats, isAnnual]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/team-billing/plans`);
      const data = await res.json();
      setPlans(data.plans || []);
      if (data.plans?.length > 0) {
        setSelectedPlan(data.plans[1]); // Default to middle plan
      }
    } catch (error) {
      console.error('Error fetching team plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/api/team-billing/workspace/${workspaceId}/subscription`);
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const calculatePrice = async () => {
    if (!selectedPlan) return;
    
    try {
      const res = await fetch(
        `${API_URL}/api/team-billing/calculate-price?plan_id=${selectedPlan.id}&seats=${seats}&billing_period=${isAnnual ? 'yearly' : 'monthly'}`
      );
      const data = await res.json();
      setPriceCalculation(data.calculation);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/team-billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          owner_id: ownerId,
          plan_id: selectedPlan.id,
          billing_period: isAnnual ? 'yearly' : 'monthly',
          seats,
          origin_url: window.location.origin
        })
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment'
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getPlanIcon = (planId) => {
    const icons = {
      'team_starter': Users,
      'team_professional': Zap,
      'team_enterprise': Crown
    };
    return icons[planId] || Users;
  };

  if (subscription) {
    // Show current subscription
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Team Billing Active</CardTitle>
                <CardDescription>{subscription.seats} seats • {subscription.billing_period}</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-600">Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">${subscription.total_price}</p>
              <p className="text-sm text-gray-500">/{subscription.billing_period === 'yearly' ? 'year' : 'month'}</p>
            </div>
            <Button variant="outline" onClick={() => setShowDialog(true)}>
              Manage Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Team Billing</CardTitle>
              <CardDescription>Pay for your entire workspace team</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Current team size</span>
              <Badge variant="secondary">{currentMemberCount} members</Badge>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-indigo-900 dark:text-indigo-100">Save 17% with annual billing</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get 2 months free when you pay yearly
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => setShowDialog(true)}>
            <CreditCard className="w-4 h-4 mr-2" />
            Set Up Team Billing
          </Button>
        </CardFooter>
      </Card>

      {/* Team Billing Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Team Plan</DialogTitle>
            <DialogDescription>
              Select a plan and number of seats for your workspace
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <Label className={!isAnnual ? "font-semibold" : "text-gray-500"}>Monthly</Label>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <Label className={isAnnual ? "font-semibold" : "text-gray-500"}>
                Annual
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                  Save 17%
                </Badge>
              </Label>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const Icon = getPlanIcon(plan.id);
                const isSelected = selectedPlan?.id === plan.id;
                const price = isAnnual 
                  ? Math.round(plan.price_per_seat_yearly / 12)
                  : plan.price_per_seat_monthly;
                
                return (
                  <Card 
                    key={plan.id}
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected 
                        ? "border-indigo-500 ring-2 ring-indigo-500/20" 
                        : "hover:border-gray-300"
                    )}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-indigo-600" />
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3">
                        <span className="text-2xl font-bold">${price}</span>
                        <span className="text-gray-500 text-sm">/seat/mo</span>
                      </div>
                      <ul className="space-y-1.5 text-sm">
                        {plan.features?.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Seats Selector */}
            {selectedPlan && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Number of Seats</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSeats(Math.max(selectedPlan.min_seats, seats - 1))}
                      disabled={seats <= selectedPlan.min_seats}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg">{seats}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSeats(seats + 1)}
                      disabled={selectedPlan.max_seats !== -1 && seats >= selectedPlan.max_seats}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Slider
                  value={[seats]}
                  onValueChange={([value]) => setSeats(value)}
                  min={selectedPlan.min_seats}
                  max={selectedPlan.max_seats === -1 ? 100 : selectedPlan.max_seats}
                  step={1}
                  className="w-full"
                />
                
                <p className="text-sm text-gray-500 text-center">
                  {selectedPlan.min_seats} - {selectedPlan.max_seats === -1 ? 'Unlimited' : selectedPlan.max_seats} seats
                </p>
              </div>
            )}

            {/* Price Summary */}
            {priceCalculation && (
              <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{priceCalculation.plan_name}</p>
                    <p className="text-sm text-gray-500">{seats} seats • {isAnnual ? 'Annual' : 'Monthly'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${priceCalculation.total_price}
                    </p>
                    <p className="text-sm text-gray-500">
                      /{isAnnual ? 'year' : 'month'}
                    </p>
                  </div>
                </div>
                
                {isAnnual && priceCalculation.annual_savings && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-green-700 dark:text-green-400 font-medium">Annual Savings</span>
                    <span className="text-green-700 dark:text-green-400 font-bold">
                      ${priceCalculation.annual_savings.savings} ({priceCalculation.annual_savings.savings_percentage}%)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={!selectedPlan || checkoutLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {checkoutLoading ? (
                'Processing...'
              ) : (
                <>
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamBillingCard;
