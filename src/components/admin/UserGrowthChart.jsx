
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const UserGrowthChart = () => {
  // Mock data for 30 days
  const data = [12, 15, 18, 22, 20, 25, 28, 35, 32, 40, 45, 42, 50, 55, 58, 62, 65, 70, 68, 75, 80, 85, 82, 90, 95, 92, 98, 105, 110, 115];
  const max = Math.max(...data);
  const min = Math.min(...data);
  
  // Normalize data for SVG points (height 200px, width 100%)
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / (max - min)) * 80; // keep some padding
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `0,100 ${points} 100,100`;

  return (
    <Card className="col-span-1 lg:col-span-2 rounded-xl shadow-lg border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-indigo-500" />
          User Growth
          <span className="text-xs font-normal text-muted-foreground ml-auto bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">Last 30 Days</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[280px] w-full relative pt-6">
        <div className="absolute inset-0 flex items-end px-6 pb-6 pt-16">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {/* Grid lines */}
            <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="60" x2="100" y2="60" stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" strokeOpacity="0.1" vectorEffect="non-scaling-stroke" />
            
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area */}
            <motion.polygon
              points={areaPath}
              fill="url(#gradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />
            
            {/* Line */}
            <motion.polyline
              points={points}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Tooltip dot (static for now, normally interactive) */}
            <circle cx="100" cy="20" r="1.5" fill="#6366f1" className="animate-pulse" />
          </svg>
          
          {/* Axis Labels */}
          <div className="absolute bottom-2 left-6 right-6 flex justify-between text-[10px] text-muted-foreground">
            <span>30 days ago</span>
            <span>15 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;
