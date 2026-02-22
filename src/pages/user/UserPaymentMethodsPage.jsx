
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, ShieldCheck, Lock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { paymentUIService } from '@/services/paymentUIService';
import PaymentMethodCard from '@/components/payment/PaymentMethodCard';

const UserPaymentMethodsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Mock form state
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setMethods(paymentUIService.getMockPaymentMethods());
      setLoading(false);
    }, 800);
  }, []);

  const handleSetDefault = (id) => {
    const updated = methods.map(m => ({ ...m, isDefault: m.id === id }));
    setMethods(updated);
    toast({ title: "Updated", description: "Default payment method changed." });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this payment method?')) {
      setMethods(methods.filter(m => m.id !== id));
      toast({ title: "Removed", description: "Payment method deleted successfully." });
    }
  };

  const handleAddMethod = () => {
    // Basic validation mock
    if (!newCard.number || !newCard.expiry) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all fields." });
      return;
    }

    const newMethod = {
      id: `pm_${Date.now()}`,
      type: 'card',
      brand: 'Visa', // Mock
      last4: newCard.number.slice(-4),
      expiry: newCard.expiry,
      isDefault: methods.length === 0 // Make default if first
    };

    setMethods([...methods, newMethod]);
    setIsAddModalOpen(false);
    setNewCard({ number: '', expiry: '', cvc: '', name: '' });
    toast({ title: "Success", description: "New payment method added." });
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8">
      <Helmet>
        <title>Payment Methods | Munal</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
          <p className="text-gray-500 mt-2">Manage your saved cards and payment details.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Add New Method
        </Button>
      </div>

      {/* Security Badge */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 flex items-center gap-3 text-sm text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <p>Your payment information is securely stored and encrypted using industry-standard protocols. We are PCI DSS compliant.</p>
      </div>

      {/* Methods Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
           <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">No payment methods yet</h3>
           <p className="text-gray-500 mb-4">Add a card to make checkout faster.</p>
           <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>Add Method</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {methods.map(method => (
            <PaymentMethodCard 
              key={method.id} 
              method={method} 
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
              onEdit={() => {}} 
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details. We'll verify them securely.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Cardholder Name</Label>
              <Input id="name" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="number">Card Number</Label>
              <div className="relative">
                <Input id="number" value={newCard.number} onChange={e => setNewCard({...newCard, number: e.target.value})} placeholder="0000 0000 0000 0000" />
                <Lock className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" value={newCard.expiry} onChange={e => setNewCard({...newCard, expiry: e.target.value})} placeholder="MM/YY" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" value={newCard.cvc} onChange={e => setNewCard({...newCard, cvc: e.target.value})} placeholder="123" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMethod}>Save Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPaymentMethodsPage;
