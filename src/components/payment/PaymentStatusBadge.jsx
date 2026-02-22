
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { paymentUIService } from '@/services/paymentUIService';
import { cn } from '@/lib/utils';

const PaymentStatusBadge = ({ status, className }) => {
  const colorClass = paymentUIService.getStatusColor(status);
  const Icon = paymentUIService.getStatusIcon(status);

  return (
    <Badge variant="outline" className={cn("flex items-center gap-1.5 w-fit", colorClass, className)}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

export default PaymentStatusBadge;
