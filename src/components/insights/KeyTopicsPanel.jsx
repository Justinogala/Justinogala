
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const KeyTopicsPanel = ({ topics }) => {
  if (!topics || topics.length === 0) return null;

  // Find max frequency to calculate progress bars
  const maxFreq = Math.max(...topics.map(t => t.frequency));

  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
          <Hash className="w-5 h-5 text-blue-500" />
          Key Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topics.map((topic) => (
            <div key={topic.id} className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">{topic.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{topic.frequency} mentions</span>
                  {topic.timestamp && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 border-blue-200">
                            <Clock className="w-3 h-3 mr-1" />
                            {topic.timestamp}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Jump to first occurrence</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500/80 rounded-full" 
                  style={{ width: `${(topic.frequency / maxFreq) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyTopicsPanel;
