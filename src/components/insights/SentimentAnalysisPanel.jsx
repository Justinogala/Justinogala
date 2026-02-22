
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse, Smile, Meh, Frown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const SentimentIcon = ({ sentiment }) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive': return <Smile className="w-5 h-5 text-green-500" />;
    case 'negative': return <Frown className="w-5 h-5 text-red-500" />;
    default: return <Meh className="w-5 h-5 text-gray-500" />;
  }
};

const SentimentAnalysisPanel = ({ sentiment }) => {
  if (!sentiment) return null;

  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
          <HeartPulse className="w-5 h-5 text-pink-500" />
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Score */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700 mb-2">
              <span className={`text-2xl font-bold ${sentiment.score > 70 ? 'text-green-500' : sentiment.score < 40 ? 'text-red-500' : 'text-amber-500'}`}>
                {sentiment.score}%
              </span>
            </div>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{sentiment.overall} Tone</p>
          </div>

          {/* Speaker Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">By Speaker</h4>
            {sentiment.bySpeaker.map((speaker, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <SentimentIcon sentiment={speaker.sentiment} />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{speaker.name}</span>
                    <span className="text-gray-500">{speaker.score}%</span>
                  </div>
                  <Progress value={speaker.score} className={`h-1.5 ${speaker.sentiment === 'positive' ? 'bg-green-100 [&>div]:bg-green-500' : 'bg-gray-100 [&>div]:bg-gray-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Visualization (Simple Bar Chart) */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Conversation Timeline</h4>
          <div className="flex items-end gap-1 h-16 w-full">
            {sentiment.timeline.map((point, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-sm transition-all hover:opacity-80 ${point.score > 60 ? 'bg-green-400' : point.score < 40 ? 'bg-red-400' : 'bg-gray-300'}`}
                style={{ height: `${point.score}%` }}
                title={`${point.time}: ${point.sentiment}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Start</span>
            <span>End</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysisPanel;
