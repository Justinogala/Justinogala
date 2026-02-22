
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const StatsCard = ({ label, value, icon: Icon, color, bg, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="h-full"
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-6 h-full transition-all duration-300",
        "glass-card border border-white/20 dark:border-white/5 shadow-lg hover:shadow-xl",
        "group"
      )}>
        {/* Abstract Background Decoration */}
        <div className={cn(
          "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-xl transition-transform duration-500 group-hover:scale-150",
          color === 'text-blue-500' ? 'bg-blue-500' : 
          color === 'text-green-500' ? 'bg-green-500' :
          color === 'text-purple-500' ? 'bg-purple-500' :
          'bg-orange-500'
        )} />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {value}
            </h3>
          </div>
          <div className={cn(
            "p-3 rounded-xl backdrop-blur-md shadow-sm", 
            "bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10"
          )}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
