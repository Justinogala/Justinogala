
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const MetricsCard = ({ 
  title, 
  value, 
  trend, 
  trendValue, 
  icon: Icon, 
  loading = false, 
  className 
}) => {
  // Fallback skeleton component
  const Skeleton = ({ className: skeletonClassName, ...props }) => (
    <div className={cn("animate-pulse rounded-md bg-muted", skeletonClassName)} {...props} />
  );

  if (loading) {
    return (
      <Card className="rounded-xl shadow-lg border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm h-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  const isNeutral = trend === 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className={cn(
        "rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden h-full group",
        className
      )}>
        <CardContent className="p-6 relative z-10">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            {Icon && <Icon className="w-24 h-24" />}
          </div>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
              <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white tracking-tight">{value}</h3>
            </div>
            {Icon && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-inner">
                <Icon className="w-6 h-6" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-opacity-10",
              isPositive && "bg-green-500 text-green-600 dark:text-green-400",
              isNegative && "bg-red-500 text-red-600 dark:text-red-400",
              isNeutral && "bg-gray-500 text-gray-600 dark:text-gray-400"
            )}>
              {isPositive && <ArrowUp className="w-3 h-3 mr-1" />}
              {isNegative && <ArrowDown className="w-3 h-3 mr-1" />}
              {isNeutral && <Minus className="w-3 h-3 mr-1" />}
              {trendValue}
            </div>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </CardContent>
        
        {/* Decorative gradient bar at bottom */}
        <div className={cn(
          "h-1 w-full bg-gradient-to-r",
          isPositive ? "from-green-400 to-emerald-600" : 
          isNegative ? "from-red-400 to-rose-600" : "from-gray-400 to-slate-600"
        )} />
      </Card>
    </motion.div>
  );
};

export default MetricsCard;
