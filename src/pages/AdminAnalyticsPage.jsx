
import React, { useEffect, useState } from 'react';
import { getUsageMetrics } from '@/services/adminAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Activity, HardDrive, DollarSign, Users } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, subtext }) => (
  <Card className="bg-slate-900 border-white/10">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
          {subtext && <p className="text-xs text-green-400 mt-1">{subtext}</p>}
        </div>
        <div className="p-3 bg-white/5 rounded-full">
          <Icon className="w-6 h-6 text-indigo-400" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const BarChart = ({ data, labels }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end justify-between h-48 gap-2 pt-4">
      {data.map((val, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
          <div 
            className="w-full bg-indigo-500/50 hover:bg-indigo-500 transition-all rounded-t-sm relative"
            style={{ height: `${(val / max) * 100}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 z-10">
              {val}
            </div>
          </div>
          <span className="text-[10px] text-gray-500 rotate-0 truncate w-full text-center">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
};

const AdminAnalyticsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [range, setRange] = useState('7d');
  
  useEffect(() => {
    getUsageMetrics(range).then(setMetrics);
  }, [range]);

  if (!metrics) return <div className="text-white p-8">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <select 
            className="bg-slate-900 border border-white/10 rounded-md text-sm text-white px-3 py-2"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Transcription" 
          value={metrics.transcriptionVolume.total.toLocaleString() + " mins"}
          icon={Activity}
          subtext="+12% vs previous period"
        />
        <MetricCard 
          title="Active Users" 
          value={metrics.activeUsers.total}
          icon={Users}
          subtext="+5% growth"
        />
        <MetricCard 
          title="API Calls" 
          value={(metrics.apiCalls.total / 1000).toFixed(1) + "k"}
          icon={HardDrive}
        />
        <MetricCard 
          title="Estimated Cost" 
          value={"$" + metrics.costs.total}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Transcription Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart 
              data={metrics.transcriptionVolume.trend} 
              labels={metrics.transcriptionVolume.labels} 
            />
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Active Users Growth</CardTitle>
          </CardHeader>
          <CardContent>
             <BarChart 
              data={metrics.activeUsers.trend} 
              labels={metrics.activeUsers.labels} 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
             <CardTitle className="text-white text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.costs.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.name}</span>
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="h-2 bg-slate-800 rounded-full flex-1 overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: `${(item.value / metrics.costs.total) * 100}%` }} />
                    </div>
                    <span className="text-white font-mono w-16 text-right">${item.value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-white/10">
          <CardHeader>
             <CardTitle className="text-white text-lg">API Usage by Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {metrics.apiCalls.byEndpoint.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-300 font-mono text-sm">{item.name}</span>
                   <div className="flex items-center gap-4 w-1/2">
                    <div className="h-2 bg-slate-800 rounded-full flex-1 overflow-hidden">
                       <div className="h-full bg-purple-500" style={{ width: `${item.value}%` }} />
                    </div>
                    <span className="text-white font-mono w-12 text-right">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
