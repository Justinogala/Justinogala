
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminStatsCard = ({ title, value, icon: Icon, trend, trendUp, description }) => {
  return (
    <Card className="border-white/10 bg-slate-800/50 hover:bg-slate-800/80 transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
          </div>
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            {Icon ? <Icon className="w-5 h-5 text-indigo-400" /> : <Activity className="w-5 h-5 text-indigo-400" />}
          </div>
        </div>
        
        {(trend || description) && (
          <div className="flex items-center mt-4 text-xs">
            {trend && (
              <span className={cn(
                "flex items-center font-medium mr-2",
                trendUp ? "text-green-400" : "text-red-400"
              )}>
                {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {trend}
              </span>
            )}
            {description && <span className="text-gray-500">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminStatsCard;
