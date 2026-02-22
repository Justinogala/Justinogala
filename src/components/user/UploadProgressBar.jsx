
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileVideo, FileAudio, X, CheckCircle, AlertCircle } from 'lucide-react';

const UploadProgressBar = ({ file, progress, status, error, onCancel }) => {
  if (status === 'idle' || !file) return null;

  const isVideo = file.type.startsWith('video');
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {isVideo ? (
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FileVideo className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                    <FileAudio className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
                    {file.name}
                  </h4>
                  <button 
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {sizeMB} MB • {status === 'uploading' ? 'Uploading...' : status === 'completed' ? 'Completed' : 'Failed'}
                </p>

                {status === 'failed' ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error || 'Upload failed'}
                  </div>
                ) : (
                  <div className="relative w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        status === 'completed' ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}
              </div>
              
              {status === 'completed' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0 text-green-500"
                >
                  <CheckCircle className="w-6 h-6" />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadProgressBar;
