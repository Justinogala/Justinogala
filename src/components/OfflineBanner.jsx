import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CloudOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import offlineDB from '@/services/offlineDB';
import { API_URL } from '@/lib/api';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      // Auto-sync when back online
      setSyncing(true);
      try {
        const token = (() => {
          try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token; } catch { return null; }
        })();
        if (token) {
          const result = await offlineDB.processQueue(API_URL, token);
          if (result.processed > 0) {
            setShowSynced(true);
            setTimeout(() => setShowSynced(false), 3000);
          }
        }
      } catch (e) { console.error('Sync error:', e); }
      setSyncing(false);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const updatePendingCount = async () => {
      try {
        const pending = await offlineDB.getPendingActions();
        setPendingCount(pending.length);
      } catch { setPendingCount(0); }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-action-queued', updatePendingCount);

    // Also listen for SW sync message
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SYNC_REQUESTED') handleOnline();
      });
    }

    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-action-queued', updatePendingCount);
    };
  }, []);

  // Nothing to show
  if (!isOffline && !syncing && !showSynced && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300",
        isOffline ? "bg-amber-500 text-white" :
        syncing ? "bg-blue-500 text-white" :
        showSynced ? "bg-emerald-500 text-white" :
        pendingCount > 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" : ""
      )}
      data-testid="offline-banner"
    >
      {isOffline && (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You're offline — changes will sync when you reconnect</span>
          {pendingCount > 0 && (
            <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">{pendingCount} pending</span>
          )}
        </>
      )}
      {!isOffline && syncing && (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing offline changes...</span>
        </>
      )}
      {!isOffline && !syncing && showSynced && (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>All changes synced</span>
        </>
      )}
      {!isOffline && !syncing && !showSynced && pendingCount > 0 && (
        <>
          <CloudOff className="w-4 h-4" />
          <span>{pendingCount} changes pending sync</span>
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
