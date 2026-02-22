
import React from 'react';
import { CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PaymentMethodCard = ({ type, last4, expiry, isDefault, onDelete }) => {
  return (
    <Card className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className="h-10 w-14 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-gray-500" />
        </div>
        <div>
          <p className="font-medium text-sm flex items-center gap-2">
            •••• •••• •••• {last4}
            {isDefault && (
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">Expires {expiry}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
};

export default PaymentMethodCard;
