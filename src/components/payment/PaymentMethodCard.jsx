
import React from 'react';
import { CreditCard, MoreVertical, Trash2, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PaymentMethodCard = ({ method, onSetDefault, onDelete, onEdit }) => {
  return (
    <Card className={cn(
      "relative p-6 transition-all duration-200 hover:shadow-md border-2",
      method.isDefault 
        ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/10" 
        : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
    )}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {/* Logic to show different icons based on brand could go here */}
            <CreditCard className="w-8 h-8 text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">
                {method.brand || method.type}
              </h3>
              {method.isDefault && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                  Default
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-mono mt-1">
              •••• •••• •••• {method.last4 || '0000'}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Expires {method.expiry || 'N/A'}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!method.isDefault && (
              <DropdownMenuItem onClick={() => onSetDefault(method.id)}>
                <Star className="w-4 h-4 mr-2" /> Set as Default
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(method)} disabled>
              Edit Details (Soon)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(method.id)}
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="absolute top-0 right-0 p-6 pointer-events-none">
        {method.isDefault && <Check className="w-5 h-5 text-indigo-600" />}
      </div>
    </Card>
  );
};

export default PaymentMethodCard;
