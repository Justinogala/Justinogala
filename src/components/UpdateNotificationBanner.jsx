import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/lib/api';

function UpdateNotificationBanner() {
  const [updateData, setUpdateData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for real-time SSE broadcasts
    const handler = (e) => {
      const data = e.detail;
      const dismissedVersion = sessionStorage.getItem('munal_dismissed_update');
      if (dismissedVersion === data.version) return;
      setUpdateData(data);
      setDismissed(false);
    };
    window.addEventListener('munal-app-update', handler);

    // Also poll on mount (fallback if SSE missed)
    const checkOnStartup = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
        if (!session.token) return;
        const res = await fetch(`${API_URL}/api/updates/check`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.update_available && data.latest_version) {
          const dismissedVersion = sessionStorage.getItem('munal_dismissed_update');
          if (dismissedVersion !== data.latest_version.version) {
            setUpdateData({
              version: data.latest_version.version,
              title: data.latest_version.title,
              is_critical: data.latest_version.is_critical,
            });
          }
        }
      } catch { /* ignore */ }
    };
    // Delay startup check so the app loads first
    const timer = setTimeout(checkOnStartup, 3000);

    return () => {
      window.removeEventListener('munal-app-update', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    if (updateData) {
      sessionStorage.setItem('munal_dismissed_update', updateData.version);
    }
    setDismissed(true);
    setTimeout(() => setUpdateData(null), 300);
  };

  const handleUpdate = () => {
    navigate('/settings');
    // Small delay to let navigation happen, then click update tab
    setTimeout(() => {
      const tab = document.querySelector('[data-testid="update-tab"]');
      if (tab) tab.click();
    }, 500);
    handleDismiss();
  };

  if (!updateData || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-lg"
        data-testid="update-notification-banner"
      >
        <div className={`rounded-2xl shadow-2xl border backdrop-blur-lg overflow-hidden ${
          updateData.is_critical 
            ? 'bg-red-50/95 dark:bg-red-950/95 border-red-200 dark:border-red-800' 
            : 'bg-white/95 dark:bg-slate-900/95 border-gray-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center gap-3 p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              updateData.is_critical 
                ? 'bg-red-100 dark:bg-red-900/40' 
                : 'bg-gradient-to-br from-violet-500 to-indigo-600'
            }`}>
              {updateData.is_critical 
                ? <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                : <Sparkles className="w-5 h-5 text-white" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                {updateData.is_critical ? 'Critical Update Available' : 'New Update Available'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                v{updateData.version} — {updateData.title}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleUpdate}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  updateData.is_critical
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
                data-testid="update-banner-action-btn"
              >
                <Download className="w-3 h-3 inline mr-1" />
                Update
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="update-banner-dismiss-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subtle progress line at bottom */}
          {updateData.is_critical && (
            <div className="h-0.5 bg-red-200 dark:bg-red-800">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 15, ease: 'linear' }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UpdateNotificationBanner;
