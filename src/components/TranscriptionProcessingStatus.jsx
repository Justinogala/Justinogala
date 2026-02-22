
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const TranscriptionProcessingStatus = ({ 
  status, 
  progress, 
  onCancel, 
  onRetry,
  error 
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'queued':
        return {
          icon: Clock,
          color: 'text-blue-500',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          label: 'Queued',
          desc: 'Waiting for processor...'
        };
      case 'processing':
        return {
          icon: Loader2,
          color: 'text-indigo-500 animate-spin',
          bg: 'bg-indigo-100 dark:bg-indigo-900/30',
          label: 'Processing',
          desc: 'Transcribing audio...'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-100 dark:bg-green-900/30',
          label: 'Completed',
          desc: 'Ready to view'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: 'Failed',
          desc: error || 'An error occurred'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          label: 'Unknown',
          desc: 'Status unknown'
        };
    }
  };

  const display = getStatusDisplay();
  const Icon = display.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="border-l-4 border-l-indigo-500 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${display.bg}`}>
              <Icon className={`w-6 h-6 ${display.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {display.label}
                {status === 'processing' && (
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (~2 min remaining)
                  </span>
                )}
              </h4>
              <p className="text-sm text-gray-500 truncate">{display.desc}</p>
            </div>

            <div className="flex gap-2">
              {status === 'error' && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
              {status === 'processing' && (
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {(status === 'processing' || status === 'queued') && (
            <div className="mt-4 space-y-2">
              <Progress value={status === 'queued' ? 5 : 45} className="h-1.5" />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Upload</span>
                <span>Processing</span>
                <span>Finalizing</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TranscriptionProcessingStatus;
