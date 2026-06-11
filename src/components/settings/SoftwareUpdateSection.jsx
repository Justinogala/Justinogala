import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL as API } from '@/lib/api';

function SoftwareUpdateSection() {
  const getToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
      return session.token || null;
    } catch { return null; }
  };
  const [checkState, setCheckState] = useState('idle'); // idle, checking, update-available, up-to-date, updating, done
  const [updateInfo, setUpdateInfo] = useState(null);
  const [changelog, setChangelog] = useState([]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [platform, setPlatform] = useState('web');
  const progressRef = useRef(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) setPlatform('android');
    else if (ua.includes('iphone') || ua.includes('ipad')) setPlatform('ios');
    else setPlatform('web');
  }, []);

  const checkForUpdates = async () => {
    setCheckState('checking');
    setProgress(0);
    const t = getToken();
    if (!t) return;

    try {
      // Simulate a brief check delay for realistic UX
      await new Promise(r => setTimeout(r, 1500));

      const res = await fetch(`${API}/api/updates/check`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();

      if (data.update_available && data.latest_version) {
        setUpdateInfo(data);
        setCheckState('update-available');
      } else {
        setUpdateInfo(data);
        setCheckState('up-to-date');
      }

      // Also fetch changelog
      const clRes = await fetch(`${API}/api/updates/changelog`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (clRes.ok) {
        setChangelog(await clRes.json());
      }
    } catch {
      setCheckState('up-to-date');
    }
  };

  const performUpdate = async () => {
    if (platform === 'android') {
      window.open('https://play.google.com/store/apps/details?id=com.munal.ai', '_blank');
      return;
    }
    if (platform === 'ios') {
      window.open('https://apps.apple.com/app/munal-ai/id0000000000', '_blank');
      return;
    }

    // Web/PWA: cache-busting reload
    setCheckState('updating');
    setProgress(0);

    const t = getToken();

    // Animate progress bar
    const steps = [10, 25, 40, 55, 70, 85, 95, 100];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 400));
      setProgress(step);
    }

    // Acknowledge the update
    if (t) {
      try {
        await fetch(`${API}/api/updates/acknowledge`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` }
        });
      } catch { /* ignore */ }
    }

    setCheckState('done');

    // Clear caches and reload after a moment
    setTimeout(async () => {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      window.location.reload(true);
    }, 1500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6" data-testid="software-update-section">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Software Update</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {platform === 'web' ? (
              <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Web Application</span>
            ) : (
              <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> {platform === 'android' ? 'Android' : 'iOS'} App</span>
            )}
          </p>
        </div>
      </div>

      {/* Update Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Idle State */}
          {checkState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Current version: <span className="font-mono font-semibold text-gray-800 dark:text-white">v{updateInfo?.current_version || updateInfo?.latest_version?.version || '2.4.0'}</span></p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Check if a newer version is available</p>
              <Button
                onClick={checkForUpdates}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-8 py-2.5 rounded-xl shadow-lg shadow-violet-500/20"
                data-testid="check-updates-btn"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check for Updates
              </Button>
            </motion.div>
          )}

          {/* Checking State */}
          {checkState === 'checking' && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Checking for updates...</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Connecting to Munal servers</p>
            </motion.div>
          )}

          {/* Update Available State */}
          {checkState === 'update-available' && updateInfo?.latest_version && (
            <motion.div
              key="update-available"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-0"
            >
              {/* Banner */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Update Available</h4>
                    <p className="text-violet-100 text-sm mt-0.5">
                      v{updateInfo.latest_version.version} — {updateInfo.latest_version.title}
                    </p>
                    {updateInfo.latest_version.is_critical && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-100 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" /> Critical Update
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Release Notes */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(updateInfo.latest_version.release_date)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6">
                  {updateInfo.latest_version.release_notes}
                </div>

                <Button
                  onClick={performUpdate}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl py-3 shadow-lg shadow-violet-500/20"
                  data-testid="update-now-btn"
                >
                  {platform === 'web' ? (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Update Now
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Open {platform === 'android' ? 'Play Store' : 'App Store'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Up to Date State */}
          {checkState === 'up-to-date' && (
            <motion.div
              key="up-to-date"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">You're Up to Date</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Munal AI <span className="font-mono font-semibold">v{updateInfo?.current_version || updateInfo?.latest_version?.version || '2.4.0'}</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">Last checked just now</p>
              <Button
                variant="outline"
                onClick={() => setCheckState('idle')}
                className="rounded-xl"
                data-testid="check-again-btn"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Check Again
              </Button>
            </motion.div>
          )}

          {/* Updating State */}
          {checkState === 'updating' && (
            <motion.div
              key="updating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <Download className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-bounce" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Updating Munal AI</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please don't close the app</p>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{progress}%</p>
            </motion.div>
          )}

          {/* Done State */}
          {checkState === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Update Complete</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reloading the app...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Changelog Section */}
      {changelog.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setShowChangelog(!showChangelog)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            data-testid="toggle-changelog-btn"
          >
            <span className="font-medium text-gray-800 dark:text-white">Version History</span>
            {showChangelog ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          <AnimatePresence>
            {showChangelog && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-4">
                  {changelog.map((entry, i) => (
                    <div
                      key={entry.id}
                      className="relative pl-6 pb-4 border-l-2 border-gray-200 dark:border-slate-700 last:pb-0"
                      data-testid={`changelog-entry-${entry.version}`}
                    >
                      <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-violet-500" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-sm text-violet-600 dark:text-violet-400">v{entry.version}</span>
                        {entry.is_critical && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Critical</span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{entry.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(entry.created_at)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 whitespace-pre-wrap leading-relaxed">{entry.release_notes}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default SoftwareUpdateSection;
