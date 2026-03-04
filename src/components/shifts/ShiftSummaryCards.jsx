import React from 'react';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ShiftSummaryCards = ({ todayShifts = [], weekHours = 0, activeTeam = 0, pendingRequests = 0 }) => {
  const cards = [
    {
      label: "Today's Shifts",
      value: todayShifts.length,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    },
    {
      label: 'Week Total Hours',
      value: `${weekHours}h`,
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
      label: 'Active Team',
      value: activeTeam,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      label: 'Pending Requests',
      value: pendingRequests,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ShiftSummaryCards;
