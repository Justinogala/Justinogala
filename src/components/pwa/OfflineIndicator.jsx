
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { offlineDataService } from '@/services/offlineDataService';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      
      // Simulate sync process
      setTimeout(() => {
        setIsSyncing(false);
        // Hide indicator after success
        setTimeout(() => setShowIndicator(false), 2000);
      }, 1500);

      // Trigger actual sync logic here
      offlineDataService.processQueue(async (item) => {
        // Dummy handler
        console.log('Syncing item:', item);
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className={cn(
          "px-4 py-2 rounded-full shadow-lg backdrop-blur-md border flex items-center gap-2 text-sm font-medium transition-colors duration-300",
          isOnline 
            ? "bg-green-500/90 text-white border-green-600/50" 
            : "bg-slate-900/90 text-white border-slate-700/50"
        )}>
          {isOnline ? (
            isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Back online! Syncing data...</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>You're back online</span>
              </>
            )
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You are offline. Changes saved locally.</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;
