import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/lib/api';
import {
  X, Zap, Search, Pin, RefreshCw, Download, Bell, Sparkles,
  MessageSquare, FileText, Shield, Settings, Bot, Globe,
  ChevronLeft, ChevronRight, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ICON_MAP = {
  Zap, Search, Pin, RefreshCw, Download, Bell, Sparkles,
  MessageSquare, FileText, Shield, Settings, Bot, Globe, Rocket,
};

function WhatsNewModal() {
  const [data, setData] = useState(null);
  const [show, setShow] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
        if (!session.token) return;

        // Already shown this session?
        const shownVersion = localStorage.getItem('munal_whatsnew_shown');

        const res = await fetch(`${API_URL}/api/updates/whats-new`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (!res.ok) return;
        const result = await res.json();

        if (!result.has_new || result.new_versions.length === 0) return;

        const latestNew = result.new_versions[0];
        if (shownVersion === latestNew.version) return;

        setData(result);
        setShow(true);
      } catch { /* ignore */ }
    };

    // Delay check to let the app fully load
    const timer = setTimeout(check, 4500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = async () => {
    setShow(false);
    if (data?.new_versions?.[0]) {
      localStorage.setItem('munal_whatsnew_shown', data.new_versions[0].version);
    }
    // Acknowledge on backend
    try {
      const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
      if (session.token) {
        await fetch(`${API_URL}/api/updates/acknowledge`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` }
        });
      }
    } catch { /* ignore */ }
  };

  if (!show || !data?.new_versions?.length) return null;

  const version = data.new_versions[0];
  const highlights = version.highlights || [];
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(highlights.length / ITEMS_PER_PAGE));
  const currentHighlights = highlights.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          data-testid="whats-new-modal-overlay"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            data-testid="whats-new-modal"
          >
            {/* Header gradient */}
            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 pb-8 text-white">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                data-testid="whats-new-close-btn"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-violet-200">What's New</span>
              </div>

              <h2 className="text-2xl font-bold leading-tight">{version.title}</h2>
              <p className="text-violet-200 text-sm mt-1">Version {version.version}</p>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-900 p-6">
              {highlights.length > 0 ? (
                <>
                  <div className="space-y-4 min-h-[200px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={page}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {currentHighlights.map((h, i) => {
                          const IconComp = ICON_MAP[h.icon] || Sparkles;
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50"
                              data-testid={`highlight-item-${i}`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                <IconComp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{h.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{h.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                        data-testid="whats-new-prev"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex gap-1.5">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === page
                                ? 'bg-violet-600 w-5'
                                : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400'
                            }`}
                            data-testid={`whats-new-dot-${i}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                        data-testid="whats-new-next"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {version.release_notes}
                </p>
              )}

              {/* Footer */}
              <Button
                onClick={() => {
                  if (page < totalPages - 1) {
                    setPage(p => p + 1);
                  } else {
                    handleClose();
                  }
                }}
                className="w-full mt-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl py-3 text-sm font-medium shadow-lg shadow-violet-500/20"
                data-testid="whats-new-got-it-btn"
              >
                {page < totalPages - 1 ? "Continue" : "Got it, let's go!"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WhatsNewModal;
