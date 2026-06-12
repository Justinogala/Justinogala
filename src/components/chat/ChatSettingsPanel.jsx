import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, X, Volume2, VolumeX, Eye, EyeOff, CheckCheck,
  Trash2, Archive, Filter, Type, Loader2, CornerDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_BACKEND_URL || '') + '/api';

const ChatSettingsPanel = ({ open, onClose, userId, onBulkAction }) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(null);

  const loadSettings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/settings/${userId}`);
      if (res.ok) setSettings(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (open) loadSettings(); }, [open, loadSettings]);

  const updateSetting = async (key, value) => {
    const prev = settings[key];
    setSettings(s => ({ ...s, [key]: value }));
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/chat/settings/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
      } else {
        setSettings(s => ({ ...s, [key]: prev }));
      }
    } catch {
      setSettings(s => ({ ...s, [key]: prev }));
    }
    setSaving(false);
  };

  const handleBulkAction = async (action) => {
    setBulkLoading(action);
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        const data = await res.json();
        const count = data.archived_count ?? data.deleted_count ?? 0;
        toast({ title: action === 'archive-all-read' ? 'Archived' : 'Cleared', description: `${count} messages affected` });
        onBulkAction?.();
      }
    } catch {
      toast({ title: 'Error', description: 'Action failed', variant: 'destructive' });
    }
    setBulkLoading(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-r border-gray-200 dark:border-slate-800"
            data-testid="chat-settings-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-500" /> Chat Settings
              </h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} data-testid="close-settings">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {/* Notifications Section */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Notifications</p>
                  <div className="space-y-4">
                    <SettingRow
                      icon={settings?.notification_sound ? Volume2 : VolumeX}
                      label="Notification sound"
                      desc="Play sound for new messages"
                    >
                      <Switch
                        checked={settings?.notification_sound ?? true}
                        onCheckedChange={v => updateSetting('notification_sound', v)}
                        data-testid="toggle-notification-sound"
                      />
                    </SettingRow>
                    <SettingRow
                      icon={settings?.message_preview ? Eye : EyeOff}
                      label="Message preview"
                      desc="Show message content in notifications"
                    >
                      <Switch
                        checked={settings?.message_preview ?? true}
                        onCheckedChange={v => updateSetting('message_preview', v)}
                        data-testid="toggle-message-preview"
                      />
                    </SettingRow>
                    <SettingRow
                      icon={CheckCheck}
                      label="Read receipts"
                      desc="Let others see when you've read messages"
                    >
                      <Switch
                        checked={settings?.read_receipts ?? true}
                        onCheckedChange={v => updateSetting('read_receipts', v)}
                        data-testid="toggle-read-receipts"
                      />
                    </SettingRow>
                  </div>
                </div>

                {/* Manage Conversations Section */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Manage Conversations</p>
                  <div className="space-y-2">
                    <button
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
                      onClick={() => handleBulkAction('archive-all-read')}
                      disabled={bulkLoading === 'archive-all-read'}
                      data-testid="archive-all-read-btn"
                    >
                      <Archive className="w-4 h-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Archive all read</p>
                        <p className="text-[11px] text-gray-400">Move read conversations to archive</p>
                      </div>
                      {bulkLoading === 'archive-all-read' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </button>
                    <button
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                      onClick={() => {
                        if (window.confirm('Delete all read messages? This cannot be undone.')) {
                          handleBulkAction('clear-all-read');
                        }
                      }}
                      disabled={bulkLoading === 'clear-all-read'}
                      data-testid="clear-all-read-btn"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-600">Clear all read</p>
                        <p className="text-[11px] text-gray-400">Permanently delete read messages</p>
                      </div>
                      {bulkLoading === 'clear-all-read' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Preferences</p>
                  <div className="space-y-4">
                    <SettingRow icon={Type} label="Font size" desc="Adjust chat text size">
                      <Select
                        value={settings?.font_size || 'medium'}
                        onValueChange={v => updateSetting('font_size', v)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs" data-testid="font-size-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <SettingRow icon={CornerDownLeft} label="Enter to send" desc="Press Enter to send messages">
                      <Switch
                        checked={settings?.enter_to_send ?? true}
                        onCheckedChange={v => updateSetting('enter_to_send', v)}
                        data-testid="toggle-enter-to-send"
                      />
                    </SettingRow>
                    <SettingRow icon={Trash2} label="Auto-delete" desc="Delete old messages after days">
                      <Select
                        value={String(settings?.auto_delete_days ?? 0)}
                        onValueChange={v => updateSetting('auto_delete_days', parseInt(v))}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs" data-testid="auto-delete-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Never</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-slate-800 text-center">
              {saving && <p className="text-[10px] text-violet-500 animate-pulse">Saving...</p>}
              {!saving && <p className="text-[10px] text-gray-400">Changes save automatically</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SettingRow = ({ icon: Icon, label, desc, children }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2.5 min-w-0">
      <Icon className="w-4 h-4 text-gray-500 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-[11px] text-gray-400 truncate">{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

export default ChatSettingsPanel;
