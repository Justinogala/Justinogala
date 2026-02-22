
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckSquare, BarChart, ArrowRightCircle } from 'lucide-react';

const InsightCard = ({ title, icon: Icon, items, colorClass, emptyMessage }) => (
  <Card className="h-full border-white/10 bg-white/5">
    <CardHeader className="flex flex-row items-center gap-3 pb-2">
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {items && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${colorClass.replace('bg-', 'bg-')}`} />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
      )}
    </CardContent>
  </Card>
);

const InsightsSection = ({ insights }) => {
  if (!insights) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <InsightCard
        title="Key Decisions"
        icon={CheckSquare}
        items={insights.decisions}
        colorClass="bg-green-500"
        emptyMessage="No explicit decisions detected."
      />
      <InsightCard
        title="Identified Risks"
        icon={AlertTriangle}
        items={insights.risks}
        colorClass="bg-red-500"
        emptyMessage="No risks identified."
      />
      <InsightCard
        title="Follow-up Items"
        icon={ArrowRightCircle}
        items={insights.followUps}
        colorClass="bg-blue-500"
        emptyMessage="No follow-up items detected."
      />
    </div>
  );
};

export default InsightsSection;
