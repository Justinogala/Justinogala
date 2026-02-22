
import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PAYMENT_CONFIG } from '@/config/paymentConfig';

const PaymentMethod = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card 
        className={cn(
          "cursor-pointer transition-all border-2 p-4 flex items-center space-x-4",
          selected === PAYMENT_CONFIG.PROVIDERS.STRIPE 
            ? "border-indigo-500 bg-indigo-50/10" 
            : "border-border hover:border-indigo-200"
        )}
        onClick={() => onSelect(PAYMENT_CONFIG.PROVIDERS.STRIPE)}
      >
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
          <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Credit/Debit Card</h3>
          <p className="text-sm text-text-secondary">Powered by Stripe</p>
        </div>
        {selected === PAYMENT_CONFIG.PROVIDERS.STRIPE && (
          <div className="ml-auto w-4 h-4 rounded-full bg-indigo-500" />
        )}
      </Card>

      <Card 
        className={cn(
          "cursor-pointer transition-all border-2 p-4 flex items-center space-x-4",
          selected === PAYMENT_CONFIG.PROVIDERS.RAZORPAY 
            ? "border-blue-500 bg-blue-50/10" 
            : "border-border hover:border-blue-200"
        )}
        onClick={() => onSelect(PAYMENT_CONFIG.PROVIDERS.RAZORPAY)}
      >
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">UPI / NetBanking</h3>
          <p className="text-sm text-text-secondary">Powered by Razorpay</p>
        </div>
        {selected === PAYMENT_CONFIG.PROVIDERS.RAZORPAY && (
          <div className="ml-auto w-4 h-4 rounded-full bg-blue-500" />
        )}
      </Card>
    </div>
  );
};

export default PaymentMethod;
