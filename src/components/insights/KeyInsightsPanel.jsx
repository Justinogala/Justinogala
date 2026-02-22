
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const KeyInsightsPanel = ({ keyPoints }) => {
  if (!keyPoints || keyPoints.length === 0) return null;

  return (
    <Card className="h-full border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl text-gray-800 dark:text-gray-100">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {keyPoints.map((point, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 group"
            >
              <div className="mt-1 min-w-[20px]">
                <ArrowRight className="w-4 h-4 text-amber-500/50 group-hover:text-amber-600 transition-colors" />
              </div>
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {point}
              </span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default KeyInsightsPanel;
