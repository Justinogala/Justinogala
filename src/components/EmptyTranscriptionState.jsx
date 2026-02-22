
import React from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const EmptyTranscriptionState = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950 border border-dashed border-gray-200 dark:border-gray-800 shadow-sm min-h-[400px]"
    >
      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-indigo-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Transcriptions Yet
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Upload your first audio or video file to get started with transcription. We support MP3, WAV, M4A, and more.
      </p>
      
      <Button 
        onClick={() => navigate('/transcription/new')}
        size="lg"
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload New File
      </Button>
    </motion.div>
  );
};

export default EmptyTranscriptionState;
