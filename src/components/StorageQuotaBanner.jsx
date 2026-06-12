import React, { useState, useEffect } from 'react';
import { HardDrive, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Link } from 'react-router-dom';

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('munal_sessions') || '{}').token || null; } catch { return null; }
};

const StorageQuotaBanner = () => {
  const [quota, setQuota] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Check if user dismissed this session
    const dismissKey = sessionStorage.getItem('quota_banner_dismissed');
    if (dismissKey === 'true') {
      setDismissed(true);
      return;
    }

    fetch(`${API_URL}/api/storage/my-quota`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setQuota(d))
      .catch(() => {});
  }, []);

  if (dismissed || !quota || quota.usage_pct < 75) return null;

  const isFull = quota.usage_pct >= 100;
  const isCritical = quota.usage_pct >= 90;
  const isWarning = quota.usage_pct >= 75;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('quota_banner_dismissed', 'true');
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium transition-all',
        isFull && 'bg-red-600 text-white',
        isCritical && !isFull && 'bg-amber-500 text-white',
        isWarning && !isCritical && 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      )}
      data-testid="storage-quota-banner"
    >
      <HardDrive className="w-4 h-4 shrink-0" />
      <span>
        {isFull
          ? `Storage full — ${quota.used_formatted} / ${quota.limit_formatted}. File generation is blocked.`
          : isCritical
            ? `Storage at ${quota.usage_pct}% — ${quota.remaining_formatted} remaining.`
            : `Storage at ${quota.usage_pct}% — consider freeing space.`
        }
      </span>
      <Link
        to="/settings"
        className={cn(
          'inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold transition-colors shrink-0',
          isFull ? 'bg-white/20 hover:bg-white/30 text-white' :
          isCritical ? 'bg-white/20 hover:bg-white/30 text-white' :
          'bg-amber-600 hover:bg-amber-700 text-white'
        )}
        data-testid="quota-banner-cta"
      >
        {isFull ? 'Upgrade' : 'Manage'} <ArrowRight className="w-3 h-3" />
      </Link>
      <button
        onClick={handleDismiss}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors',
          isFull || isCritical ? 'hover:bg-white/20 text-white/70 hover:text-white' : 'hover:bg-amber-200 text-amber-600'
        )}
        data-testid="quota-banner-dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default StorageQuotaBanner;
