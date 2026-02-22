
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const SubscriptionStatus = ({ plan, status, nextBillingDate, amount }) => {
  const isActive = status === 'active';

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-950 border-indigo-100 dark:border-indigo-900/20">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Current Plan</p>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{plan}</h3>
          </div>
          <Badge className={isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700"}>
            {isActive ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
            {status}
          </Badge>
        </div>
        
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium">${amount}/month</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Next Billing</span>
            <span className="font-medium">{new Date(nextBillingDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
