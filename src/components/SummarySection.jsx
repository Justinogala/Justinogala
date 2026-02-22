
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const SummarySection = ({ summary, onRegenerate, isRegenerating }) => {
  const { toast } = useToast();

  const handleCopy = () => {
    const text = `Overview:\n${summary.overview}\n\nKey Points:\n${summary.keyPoints.map(p => `- ${p}`).join('\n')}\n\nOutcomes:\n${summary.outcomes.map(o => `- ${o}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Summary copied to clipboard." });
  };

  if (!summary) return null;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500/20 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <CardTitle>AI Summary</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isRegenerating}>
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
          <p className="text-gray-300 leading-relaxed">{summary.overview}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h3 className="text-lg font-semibold text-white mb-2">Key Discussion Points</h3>
          <ul className="space-y-2">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 className="text-lg font-semibold text-white mb-2">Outcomes & Decisions</h3>
          <ul className="space-y-2">
            {summary.outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default SummarySection;
