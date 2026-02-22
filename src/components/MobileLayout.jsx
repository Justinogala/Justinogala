import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { offlineService } from '@/services/offlineService';
import '@/styles/responsive.css';

const MobileLayout = ({ 
  children, 
  header, 
  footer,
  showOfflineIndicator = true,
  className 
}) => {
  // Initialize offline service
  useEffect(() => {
    offlineService.init();
    return () => offlineService.cleanup();
  }, []);

  const isOnline = offlineService.isOnline();

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Offline Indicator */}
      {showOfflineIndicator && !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-white text-xs font-bold text-center py-1 px-2 safe-area-pt">
          You are offline. Changes will sync when connection is restored.
        </div>
      )}

      {/* Header Area */}
      {header && (
        <div className="flex-none z-40">
          {header}
        </div>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-4",
        "pt-[calc(56px+env(safe-area-inset-top))]", // Account for header height + safe area
        "pb-[calc(56px+env(safe-area-inset-bottom))]"  // Account for footer height + safe area
      )}>
        {children}
      </main>

      {/* Footer / Navigation Area */}
      {footer && (
        <div className="flex-none z-40">
          {footer}
        </div>
      )}
    </div>
  );
};

export default MobileLayout;