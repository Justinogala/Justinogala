
import React, { useEffect, useState } from 'react';
import { 
  Users, Activity, DollarSign, FileText, 
  TrendingUp, BarChart2, PieChart, Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import MetricCard from './MetricCard';

import { usageStatisticsService } from '@/services/usageStatisticsService';
import { transcriptionAnalyticsService } from '@/services/transcriptionAnalyticsService';
import { paymentAnalyticsService } from '@/services/paymentAnalyticsService';
import { userEngagementService } from '@/services/userEngagementService';

const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState('30_days');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Simulate fetching fresh data
    const loadData = async () => {
        setLoading(true);
        // Mock delay
        await new Promise(r => setTimeout(r, 600));

        const usage = usageStatisticsService.getOverviewStats();
        const transcription = transcriptionAnalyticsService.getMetrics();
        const finance = paymentAnalyticsService.getFinancialMetrics();
        const engagement = userEngagementService.getEngagementMetrics();
        const revenueTrends = paymentAnalyticsService.getRevenueTrends();

        setMetrics({
            usage,
            transcription,
            finance,
            engagement,
            revenueTrends
        });
        setLoading(false);
    };

    loadData();
  }, [period]);

  if (loading || !metrics) {
      return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
              {[1,2,3,4].map(i => (
                  <div key={i} className="h-32 bg-muted/20 rounded-xl" />
              ))}
          </div>
      );
  }

  // Simple visual bar chart using CSS for Revenue Trend
  const maxRevenue = Math.max(...metrics.revenueTrends.map(d => d.revenue));

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Overview</h2>
        <div className="flex gap-2">
           <Select value={period} onValueChange={setPeriod}>
             <SelectTrigger className="w-[180px]">
               <SelectValue placeholder="Select period" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="7_days">Last 7 Days</SelectItem>
               <SelectItem value="30_days">Last 30 Days</SelectItem>
               <SelectItem value="90_days">Last 3 Months</SelectItem>
               <SelectItem value="year">Last Year</SelectItem>
             </SelectContent>
           </Select>
           <Button variant="outline" size="icon">
             <Download className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Revenue" 
          value={`$${metrics.finance.totalRevenue.toLocaleString()}`}
          change={12.5}
          trend="up"
          icon={DollarSign}
          color="green"
          delay={0.1}
        />
        <MetricCard 
          title="Active Users" 
          value={metrics.usage.activeUsers}
          change={5.2}
          trend="up"
          icon={Users}
          color="blue"
          delay={0.2}
        />
        <MetricCard 
          title="Transcriptions" 
          value={metrics.transcription.totalCount}
          change={-2.1}
          trend="down"
          icon={FileText}
          color="orange"
          delay={0.3}
        />
        <MetricCard 
          title="Avg Engagement" 
          value={`${metrics.engagement.adoptionRate}%`}
          change={0.0}
          trend="neutral"
          icon={Activity}
          color="purple"
          delay={0.4}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] flex items-end justify-between gap-2 pt-4">
                    {metrics.revenueTrends.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                             <div className="relative w-full flex justify-center">
                                 <div 
                                    className="w-4/5 bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-400"
                                    style={{ height: `${(item.revenue / maxRevenue) * 150}px` }}
                                 />
                                 {/* Tooltip */}
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                     ${item.revenue}
                                 </div>
                             </div>
                             <span className="text-xs text-muted-foreground">{item.month}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-lg">Subscription Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 pt-2">
                    {Object.entries(metrics.finance.planDistribution).map(([plan, count]) => {
                         const total = metrics.finance.subscriptionCount || 1;
                         const percentage = Math.round((count / total) * 100);
                         return (
                             <div key={plan} className="space-y-1">
                                 <div className="flex justify-between text-sm">
                                     <span className="capitalize font-medium">{plan}</span>
                                     <span className="text-muted-foreground">{count} users ({percentage}%)</span>
                                 </div>
                                 <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-indigo-500" 
                                        style={{ width: `${percentage}%` }}
                                     />
                                 </div>
                             </div>
                         );
                    })}
                </div>
            </CardContent>
        </Card>
      </div>
      
      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
          <Card>
              <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                          <Activity className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Accuracy</p>
                          <h4 className="text-xl font-bold">{metrics.transcription.avgAccuracy}%</h4>
                      </div>
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg">
                          <Users className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Churn Rate</p>
                          <h4 className="text-xl font-bold">{metrics.finance.churnRate}%</h4>
                      </div>
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-lg">
                          <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">LTV</p>
                          <h4 className="text-xl font-bold">${metrics.finance.ltv}</h4>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
