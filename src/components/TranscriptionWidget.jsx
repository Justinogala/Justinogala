
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Plus, Mic, CheckCircle2, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranscriptionHistory } from '@/hooks/useTranscriptionHistory';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TranscriptionWidget = () => {
  const { transcriptions, loading } = useTranscriptionHistory();
  const navigate = useNavigate();
  
  const recentItems = transcriptions.slice(0, 4);

  const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return { 
      icon: CheckCircle2, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10',
      label: 'Completed'
    };
    if (s === 'processing') return { 
      icon: Activity, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      label: 'Processing' 
    };
    return { 
      icon: Clock, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10',
      label: 'Pending'
    };
  };

  return (
    <div className="glass-panel rounded-2xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-indigo-500" />
            Recent Transcriptions
          </h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/transcription/new')} className="rounded-full text-xs h-8 border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
          <Plus className="w-3 h-3 mr-1" /> New
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
           <div className="space-y-3">
             {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />)}
           </div>
        ) : recentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-4 text-gray-500">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-2">
              <Mic className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm font-medium">No transcriptions yet.</p>
            <p className="text-xs mt-1 text-gray-400">Start recording to see them here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentItems.map((item, idx) => {
              const statusConfig = getStatusConfig(item.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => navigate(`/transcriptions/${item.id}`)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", statusConfig.bg)}>
                      <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 transition-colors">
                        {item.fileName || item.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.uploadDate || item.date ? format(new Date(item.uploadDate || item.date), 'MMM d') : '-'}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/50 flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => navigate('/transcriptions')} className="text-xs text-gray-500 hover:text-indigo-600 w-full">
           View All Transcriptions <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default TranscriptionWidget;
