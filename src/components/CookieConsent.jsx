import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COOKIE_KEY = 'munal_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [prefs, setPrefs] = useState({ essential: true, analytics: true, marketing: false });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: true, analytics: true, marketing: true, ts: Date.now() }));
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: false, analytics: false, marketing: false, ts: Date.now() }));
    setVisible(false);
  };

  const handleSavePrefs = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: true, ...prefs, ts: Date.now() }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-6"
          data-testid="cookie-consent"
        >
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/10 border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Main banner */}
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex-shrink-0 mt-0.5 hidden sm:block">
                  <Cookie className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">We use cookies</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    We use cookies to personalize content and improve our services. Accept, reject, or manage your preferences.
                  </p>

                  {/* Manage panel */}
                  <AnimatePresence>
                    {showManage && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                          {[
                            { key: 'essential', label: 'Essential', desc: 'Required for the site to function.', locked: true },
                            { key: 'analytics', label: 'Analytics', desc: 'Help us understand how visitors use the site.' },
                            { key: 'marketing', label: 'Marketing', desc: 'Used for targeted advertising and campaigns.' },
                          ].map((item) => (
                            <label key={item.key} className="flex items-center justify-between gap-3 cursor-pointer group">
                              <div>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.label}</p>
                                <p className="text-[11px] text-gray-400">{item.desc}</p>
                              </div>
                              <div className="relative flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={prefs[item.key]}
                                  disabled={item.locked}
                                  onChange={() => !item.locked && setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                                  className="sr-only peer"
                                />
                                <div className={cn(
                                  "w-9 h-5 rounded-full transition-colors",
                                  item.locked ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700 peer-checked:bg-emerald-500"
                                )} />
                                <div className={cn(
                                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                  (prefs[item.key]) ? "translate-x-4" : ""
                                )} />
                              </div>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 mt-3 sm:mt-5 sm:justify-end flex-wrap">
                <button
                  onClick={() => setShowManage(!showManage)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  data-testid="cookie-manage-btn"
                >
                  {showManage ? 'Save' : 'Manage'}
                </button>
                {showManage ? (
                  <button
                    onClick={handleSavePrefs}
                    className="px-4 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                    data-testid="cookie-save-btn"
                  >
                    Save
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleReject}
                      className="px-3 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      data-testid="cookie-reject-btn"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleAccept}
                      className="px-4 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                      data-testid="cookie-accept-btn"
                    >
                      Accept
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
