
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const RevenueChart = () => {
  const data = [
    { month: 'Jan', value: 4000 },
    { month: 'Feb', value: 3000 },
    { month: 'Mar', value: 2000 },
    { month: 'Apr', value: 2780 },
    { month: 'May', value: 1890 },
    { month: 'Jun', value: 2390 },
    { month: 'Jul', value: 3490 },
    { month: 'Aug', value: 4200 },
    { month: 'Sep', value: 5100 },
    { month: 'Oct', value: 5800 },
    { month: 'Nov', value: 6200 },
    { month: 'Dec', value: 7400 },
  ];

  const max = Math.max(...data.map(d => d.value));
  const avg = data.reduce((a, b) => a + b.value, 0) / data.length;

  return (
    <Card className="col-span-1 lg:col-span-2 rounded-xl shadow-lg border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-[350px]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-green-500" />
            Revenue
          </CardTitle>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">$48,150</span>
            <p className="text-xs text-muted-foreground">Total (Year)</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[260px] flex items-end justify-between gap-2 pt-8 px-6 pb-2">
        {data.map((item, index) => {
          const height = (item.value / max) * 100;
          const isAboveAvg = item.value >= avg;
          
          return (
            <div key={item.month} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group">
              <div className="relative w-full h-full flex items-end justify-center">
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                  ${item.value.toLocaleString()}
                </div>
                
                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05 }}
                  className={cn(
                    "w-full max-w-[30px] rounded-t-sm transition-all duration-300 hover:brightness-110",
                    isAboveAvg 
                      ? "bg-gradient-to-t from-green-500 to-emerald-400 opacity-90" 
                      : "bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600 opacity-70"
                  )}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{item.month}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
