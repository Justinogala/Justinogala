
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon: Icon,
  color = 'indigo',
  delay = 0 
}) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400'
  };

  const bgColors = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card hover className="h-full border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            </div>
            {Icon && (
              <div className={cn("p-2 rounded-lg", bgColors[color] || bgColors.indigo)}>
                <Icon className="w-5 h-5" />
              </div>
            )}
          </div>
          
          <div className="flex items-center text-xs">
            {trend === 'up' && <ArrowUp className="w-3 h-3 mr-1 text-green-500" />}
            {trend === 'down' && <ArrowDown className="w-3 h-3 mr-1 text-red-500" />}
            {trend === 'neutral' && <Minus className="w-3 h-3 mr-1 text-gray-400" />}
            
            <span className={cn("font-medium", trendColors[trend])}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;
