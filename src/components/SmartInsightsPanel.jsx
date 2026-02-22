
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  Target, 
  List, 
  RefreshCw, 
  Copy, 
  Check, 
  Sparkles,
  BrainCircuit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const InsightCard = ({ title, icon: Icon, children, onCopy, colorClass }) => (
  <Card className="border-l-4 border-l-transparent hover:border-l-current transition-all duration-300 hover:shadow-md h-full">
    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
          <Icon className={`w-5 h-5`} />
        </div>
        {title}
      </CardTitle>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={onCopy}>
        <Copy className="w-4 h-4" />
      </Button>
    </CardHeader>
    <CardContent className="pt-2">
      {children}
    </CardContent>
  </Card>
);

const SmartInsightsPanel = ({ insights, loading, onRegenerate, onGenerate }) => {
  const { toast } = useToast();

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`
    });
  };

  if (loading) {
    return (
      <div className="grid gap-6 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
        <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
          <BrainCircuit className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Generate Smart Insights</h3>
        <p className="text-gray-500 max-w-md mb-6">
          Use AI to automatically summarize this meeting, extract key decisions, and identify important context.
        </p>
        <Button onClick={onGenerate} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Sparkles className="w-4 h-4" /> Generate Insights
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Sparkles className="w-3 h-3 mr-1" /> AI Generated
          </Badge>
          <span className="text-xs text-gray-400">
            Generated {new Date(insights.createdAt).toLocaleDateString()}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {/* Executive Summary */}
        <InsightCard 
          title="Executive Summary" 
          icon={Lightbulb} 
          colorClass="text-amber-500 bg-amber-500"
          onCopy={() => handleCopy(insights.summary, "Summary")}
        >
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {insights.summary}
          </p>
        </InsightCard>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Key Decisions */}
          <InsightCard 
            title="Key Decisions" 
            icon={Target} 
            colorClass="text-emerald-500 bg-emerald-500"
            onCopy={() => handleCopy(insights.keyDecisions.join('\n'), "Key Decisions")}
          >
            <ul className="space-y-3">
              {insights.keyDecisions.map((decision, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{decision}</span>
                </li>
              ))}
            </ul>
          </InsightCard>

          {/* Context & Discussion */}
          <InsightCard 
            title="Context & Discussion" 
            icon={List} 
            colorClass="text-blue-500 bg-blue-500"
            onCopy={() => handleCopy(insights.contextPoints.join('\n'), "Context")}
          >
            <ul className="space-y-3">
              {insights.contextPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </InsightCard>
        </div>
      </div>
    </div>
  );
};

export default SmartInsightsPanel;
