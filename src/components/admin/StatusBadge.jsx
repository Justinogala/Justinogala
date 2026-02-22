
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatusBadge = ({ status }) => {
  const isActive = status?.toLowerCase() === 'active';
  
  return (
    <Badge 
      variant={isActive ? 'success' : 'destructive'}
      className={cn(
        "gap-1.5 py-1 px-2.5 capitalize",
        isActive 
          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
      )}
    >
      {isActive ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5" />
      )}
      {status}
    </Badge>
  );
};

export default StatusBadge;
