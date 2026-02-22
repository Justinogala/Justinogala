
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { insightsService } from '@/services/insightsService';
import SummaryPanel from './SummaryPanel';
import KeyInsightsPanel from './KeyInsightsPanel';
import KeyTopicsPanel from './KeyTopicsPanel';
import SentimentAnalysisPanel from './SentimentAnalysisPanel';
import SpeakerHighlightsPanel from './SpeakerHighlightsPanel';
import ExportOptions from './ExportOptions';
import ActionItemsPanel from '@/components/ActionItemsPanel'; // Reusing existing component

const InsightsSummariesSection = ({ transcriptionText, speakers, onActionItemsUpdate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const result = await insightsService.analyzeTranscription(transcriptionText, speakers);
      setData(result);
      if (onActionItemsUpdate && result.suggestedActionItems) {
        // Optionally pass action items up if the parent manages them
        // onActionItemsUpdate(result.suggestedActionItems);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate if not present (optional, can be manual)
  useEffect(() => {
    // Uncomment to auto-generate on load:
    // if (transcriptionText && !data) generateAnalysis();
  }, [transcriptionText]);

  if (!data && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
        <div className="bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 p-4 rounded-full mb-5">
          <BrainCircuit className="w-10 h-10 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Unlock AI Insights
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
          Generate comprehensive summaries, detect action items, analyze sentiment, and extract key topics from your transcription automatically.
        </p>
        <Button onClick={generateAnalysis} size="lg" className="gap-2 shadow-lg shadow-violet-500/20">
          <Sparkles className="w-4 h-4" />
          Generate AI Analysis
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            AI Analysis & Insights
            <span className="text-xs font-normal px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 rounded-full border border-violet-200 dark:border-violet-800">
              Beta
            </span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Generated {new Date(data.analyzedAt).toLocaleDateString()} at {new Date(data.analyzedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={generateAnalysis}>
            <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
          </Button>
          <ExportOptions data={data} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100/50 dark:bg-slate-800/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SummaryPanel summary={data.summary} />
            </div>
            <div className="md:col-span-1">
              <KeyTopicsPanel topics={data.topics} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KeyInsightsPanel keyPoints={data.summary.keyPoints} />
            <SentimentAnalysisPanel sentiment={data.sentiment} />
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <SpeakerHighlightsPanel highlights={data.highlights} />
             <KeyTopicsPanel topics={data.topics} />
          </div>
          <SentimentAnalysisPanel sentiment={data.sentiment} />
        </TabsContent>

        <TabsContent value="actions">
          <ActionItemsPanel 
             actionItems={data.suggestedActionItems || []} 
             onAdd={() => {}} // Stub
             onUpdate={() => {}} // Stub
             onDelete={() => {}} // Stub
             onToggleComplete={() => {}} // Stub
             loading={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightsSummariesSection;
