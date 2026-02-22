import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, UploadCloud, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

const TranscriptionStatusIndicator = ({ 
  status, // 'uploading', 'processing', 'completed', 'failed'
  progress, 
  error, 
  onRetry 
}) => {
  
  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return {
          icon: UploadCloud,
          label: 'Uploading Audio...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          showProgress: true
        };
      case 'processing':
        return {
          icon: Loader2,
          label: 'Processing with AssemblyAI...',
          subLabel: 'This usually takes about 15-30% of the audio duration.',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          spin: true,
          showProgress: false
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          label: 'Transcription Complete',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          showProgress: false
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Transcription Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          showProgress: false
        };
      default:
        return {
          icon: Clock,
          label: 'Pending...',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full bg-white/50 ${config.color}`}>
            <Icon className={`w-5 h-5 ${config.spin ? 'animate-spin' : ''}`} />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className={`font-medium ${config.color}`}>{config.label}</h4>
              {config.showProgress && (
                <span className="text-xs font-semibold opacity-80">{Math.round(progress)}%</span>
              )}
            </div>
            
            {config.subLabel && (
              <p className="text-xs text-gray-500">{config.subLabel}</p>
            )}

            {config.showProgress && (
              <Progress value={progress} className="h-2 bg-white/50" />
            )}

            {status === 'failed' && error && (
              <div className="mt-2 text-sm text-red-600 bg-white/50 p-2 rounded">
                Error: {error}
              </div>
            )}

            {status === 'failed' && onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2 bg-white hover:bg-red-50 text-red-600 border-red-200"
              >
                Retry Transcription
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TranscriptionStatusIndicator;