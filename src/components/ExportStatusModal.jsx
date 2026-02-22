
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import '@/styles/exportStyles.css';

const ExportStatusModal = ({ isOpen, onClose, status, type, fileName }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center export-modal-overlay p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {status === 'loading' ? 'Exporting...' : status === 'success' ? 'Export Complete' : 'Export Failed'}
              </h3>
              {status !== 'loading' && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              {status === 'loading' && (
                <>
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                  <p className="text-sm text-gray-500">Generating your {type} file...</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center export-success-icon">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-white">{fileName}</p>
                    <p className="text-sm text-gray-500 mt-1">Has been downloaded successfully.</p>
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center export-success-icon">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-center text-gray-500">
                    Something went wrong while generating the file. Please try again.
                  </p>
                </>
              )}
            </div>
          </div>
          
          {status !== 'loading' && (
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 flex justify-end">
              <Button onClick={onClose} variant={status === 'success' ? 'default' : 'secondary'}>
                {status === 'success' ? 'Done' : 'Close'}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportStatusModal;
