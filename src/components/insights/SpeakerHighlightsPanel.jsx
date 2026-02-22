
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Quote, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const SpeakerHighlightsPanel = ({ highlights }) => {
  if (!highlights || highlights.length === 0) return null;

  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
          <Mic className="w-5 h-5 text-indigo-500" />
          Speaker Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {highlights.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Avatar className="h-10 w-10 border border-indigo-100 dark:border-indigo-900">
                <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 font-medium">
                  {item.speaker.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{item.speaker}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.timestamp}
                    </span>
                    {item.tag && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-indigo-200 text-indigo-600">
                        {item.tag}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Quote className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                    "{item.text}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeakerHighlightsPanel;
