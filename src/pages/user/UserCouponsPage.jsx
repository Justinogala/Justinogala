import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Tag, Copy, CheckCircle, Clock, AlertCircle, Ticket, Plus, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const UserCouponsPage = () => {
  const { toast } = useToast();
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Mock coupons data
  const [coupons] = useState([
    {
      id: '1',
      code: 'WELCOME20',
      discount: '20%',
      description: 'Welcome discount for new users',
      validUntil: '2025-03-31',
      status: 'active',
      type: 'percentage',
      minPurchase: 50
    },
    {
      id: '2',
      code: 'ANNUAL50',
      discount: '$50',
      description: 'Annual subscription discount',
      validUntil: '2025-02-28',
      status: 'active',
      type: 'fixed',
      minPurchase: 200
    },
    {
      id: '3',
      code: 'SUMMER25',
      discount: '25%',
      description: 'Summer sale promotional offer',
      validUntil: '2024-09-30',
      status: 'expired',
      type: 'percentage',
      minPurchase: 0
    },
    {
      id: '4',
      code: 'LOYALTY10',
      discount: '10%',
      description: 'Loyalty reward coupon',
      validUntil: '2025-12-31',
      status: 'used',
      type: 'percentage',
      minPurchase: 0
    }
  ]);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: `Coupon code ${code} copied to clipboard`
    });
  };

  const handleRedeem = () => {
    if (!couponCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a coupon code"
      });
      return;
    }
    
    // Mock redeem logic
    toast({
      title: "Coupon Applied",
      description: `Checking coupon code: ${couponCode}...`
    });
    setCouponCode('');
    setRedeemDialogOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
      case 'used':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><AlertCircle className="w-3 h-3 mr-1" /> Used</Badge>;
      default:
        return null;
    }
  };

  const activeCoupons = coupons.filter(c => c.status === 'active');
  const inactiveCoupons = coupons.filter(c => c.status !== 'active');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto" data-testid="user-coupons-page">
      <Helmet><title>My Coupons | Munal</title></Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Coupons</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your discount coupons</p>
        </div>
        <Button onClick={() => setRedeemDialogOpen(true)} className="gap-2" data-testid="redeem-coupon-btn">
          <Plus className="w-4 h-4" /> Redeem Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Tag className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Coupons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCoupons.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Coupons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{coupons.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Savings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$75</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Coupons */}
      {activeCoupons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Coupons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCoupons.map((coupon) => (
              <Card key={coupon.id} className="border-2 border-dashed border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-colors" data-testid={`coupon-card-${coupon.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{coupon.code}</h3>
                        <p className="text-xs text-gray-500">{coupon.description}</p>
                      </div>
                    </div>
                    {getStatusBadge(coupon.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{coupon.discount}</span>
                      <span className="text-sm text-gray-500 ml-1">OFF</span>
                      {coupon.minPurchase > 0 && (
                        <p className="text-xs text-gray-400 mt-1">Min. purchase: ${coupon.minPurchase}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopy(coupon.code, coupon.id)}
                        className="gap-2"
                        data-testid={`copy-coupon-${coupon.id}`}
                      >
                        {copiedId === coupon.id ? (
                          <><CheckCircle className="w-4 h-4 text-green-500" /> Copied</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy</>
                        )}
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">Valid until {new Date(coupon.validUntil).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expired/Used Coupons */}
      {inactiveCoupons.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">Expired & Used Coupons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
            {inactiveCoupons.map((coupon) => (
              <Card key={coupon.id} className="bg-gray-50 dark:bg-gray-900/50" data-testid={`coupon-card-${coupon.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-600 dark:text-gray-400">{coupon.code}</h3>
                        <p className="text-xs text-gray-400">{coupon.description}</p>
                      </div>
                    </div>
                    {getStatusBadge(coupon.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <span className="text-2xl font-bold text-gray-400 line-through">{coupon.discount}</span>
                      <span className="text-sm text-gray-400 ml-1">OFF</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {coupon.status === 'expired' ? 'Expired' : 'Used'} on {new Date(coupon.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {coupons.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No coupons yet</h3>
            <p className="text-gray-500 mb-4">Redeem a coupon code to get started</p>
            <Button onClick={() => setRedeemDialogOpen(true)}>Redeem Coupon</Button>
          </CardContent>
        </Card>
      )}

      {/* Redeem Coupon Dialog */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Coupon</DialogTitle>
            <DialogDescription>Enter your coupon code to apply the discount</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="text-center text-lg font-mono tracking-wider"
              data-testid="coupon-code-input"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRedeem} data-testid="apply-coupon-btn">Apply Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserCouponsPage;
