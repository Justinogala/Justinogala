
import React from 'react';
import { MessageSquare, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-slate-900">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h4>
      </div>
    </CardContent>
  </Card>
);

const HistoryStats = ({ stats }) => {
  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatCard
        icon={MessageSquare}
        label="Total Conversations"
        value={stats.totalConversations}
        color="bg-blue-500"
      />
      <StatCard
        icon={Clock}
        label="Total Duration"
        value={formatDuration(stats.totalDuration)}
        color="bg-violet-500"
      />
      <StatCard
        icon={User}
        label="Most Frequent"
        value={stats.mostFrequentContact}
        color="bg-emerald-500"
      />
    </div>
  );
};

export default HistoryStats;
