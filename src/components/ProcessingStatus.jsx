
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ProcessingStatus = ({ status, error, onRetry, onCancel, startTime }) => {
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (status === 'processing' && startTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(startTime).getTime();
        setElapsed(Math.floor((now - start) / 1000));
        
        // Fake progress based on time, capped at 90% until actually done
        setProgress(prev => (prev < 90 ? prev + (100 - prev) * 0.05 : prev));
      }, 1000);
    } else if (status === 'completed') {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          text: 'Completed Successfully'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          text: 'Processing Failed'
        };
      case 'processing':
      default:
        return {
          icon: Loader2,
          color: 'text-indigo-500',
          bgColor: 'bg-indigo-500/10',
          borderColor: 'border-indigo-500/20',
          text: 'Processing...'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (status === 'pending') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className={cn("border backdrop-blur-sm", config.borderColor, config.bgColor)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Icon className={cn("w-6 h-6", config.color, status === 'processing' && "animate-spin")} />
              <div>
                <h3 className={cn("font-medium", config.color)}>{config.text}</h3>
                {status === 'processing' && (
                  <p className="text-xs text-muted-foreground">Elapsed: {formatTime(elapsed)}</p>
                )}
              </div>
            </div>
            {status === 'processing' && (
              <span className="text-sm font-mono font-medium">{Math.round(progress)}%</span>
            )}
          </div>

          {status === 'processing' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="bg-indigo-500 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {status === 'failed' && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-900/50">
              Error: {error || "Unknown error occurred"}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {status === 'processing' && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {status === 'failed' && (
              <Button size="sm" onClick={onRetry} className="gap-2">
                <RotateCw className="w-4 h-4" /> Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProcessingStatus;
