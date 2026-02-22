
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const BillingCard = ({ title, value, subtext, icon: Icon, trend, className }) => {
  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtext || trend) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            {trend && (
              <span className={cn(
                "mr-1 font-medium",
                trend > 0 ? "text-green-500" : "text-red-500"
              )}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            )}
            {subtext}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingCard;
