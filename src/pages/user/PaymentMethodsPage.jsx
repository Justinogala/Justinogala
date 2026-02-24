import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { CreditCard, Plus, Trash2, Check, MoreVertical, Building2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PaymentMethodsPage = () => {
  const { toast } = useToast();
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: '2', type: 'card', brand: 'Mastercard', last4: '8888', expiry: '06/26', isDefault: false },
  ]);

  const handleSetDefault = (id) => {
    setPaymentMethods(prev => prev.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    })));
    toast({ title: "Default payment method updated" });
  };

  const handleDelete = (id) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    toast({ title: "Payment method removed" });
  };

  const handleAddCard = () => {
    const newCard = {
      id: Date.now().toString(),
      type: 'card',
      brand: 'Visa',
      last4: Math.floor(1000 + Math.random() * 9000).toString(),
      expiry: '12/28',
      isDefault: paymentMethods.length === 0
    };
    setPaymentMethods(prev => [...prev, newCard]);
    setAddCardOpen(false);
    toast({ title: "Payment method added successfully" });
  };

  const getCardIcon = (brand) => {
    return <CreditCard className="w-8 h-8 text-indigo-500" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Helmet><title>Payment Methods | Munal</title></Helmet>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your payment methods for subscriptions and purchases</p>
        </div>
        <Button onClick={() => setAddCardOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Method
        </Button>
      </div>

      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No payment methods</h3>
              <p className="text-gray-500 mb-4">Add a payment method to subscribe to plans</p>
              <Button onClick={() => setAddCardOpen(true)}>Add Payment Method</Button>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id} className={method.isDefault ? "border-indigo-500 border-2" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getCardIcon(method.brand)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{method.brand}</span>
                      <span className="text-gray-500">•••• {method.last4}</span>
                      {method.isDefault && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!method.isDefault && (
                      <DropdownMenuItem onClick={() => handleSetDefault(method.id)}>
                        <Check className="w-4 h-4 mr-2" /> Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(method.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Card Dialog */}
      <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>Add a new credit or debit card</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label>CVC</Label>
                <Input placeholder="123" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name on Card</Label>
              <Input placeholder="John Doe" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCardOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCard}>Add Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethodsPage;
