import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { API_URL as API } from '@/lib/api';

function AdminVersionManager() {
  const getToken = () => {
    try {
      const session = JSON.parse(localStorage.getItem('munal_sessions') || '{}');
      return session.token || null;
    } catch { return null; }
  };
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ version: '', title: '', release_notes: '', is_critical: false });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadVersions = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch(`${API}/api/updates/admin/versions`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) setVersions(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handleSubmit = async () => {
    const t = getToken();
    if (!t || !form.version.trim() || !form.title.trim()) return;
    setSaving(true);

    try {
      const url = editingId
        ? `${API}/api/updates/admin/versions/${editingId}`
        : `${API}/api/updates/admin/versions`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        showToast(editingId ? 'Version updated' : 'Version published');
        setShowForm(false);
        setEditingId(null);
        setForm({ version: '', title: '', release_notes: '', is_critical: false });
        loadVersions();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to save', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const t = getToken();
    if (!t || !confirm('Delete this version entry?')) return;
    try {
      const res = await fetch(`${API}/api/updates/admin/versions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) {
        showToast('Version deleted');
        loadVersions();
      }
    } catch { /* ignore */ }
  };

  const startEdit = (v) => {
    setForm({ version: v.version, title: v.title, release_notes: v.release_notes, is_critical: v.is_critical || false });
    setEditingId(v.id);
    setShowForm(true);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  return (
    <div className="space-y-6" data-testid="admin-version-manager">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Version Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Publish updates and release notes</p>
          </div>
        </div>
        {!showForm && (
          <Button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ version: '', title: '', release_notes: '', is_critical: false }); }}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl"
            data-testid="publish-version-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            Publish Version
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Edit Version' : 'Publish New Version'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Version Number</Label>
                  <Input
                    value={form.version}
                    onChange={e => setForm(p => ({ ...p, version: e.target.value }))}
                    placeholder="e.g., 2.2.0"
                    className="mt-1"
                    data-testid="version-input"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Title</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., AI Chat Improvements"
                    className="mt-1"
                    data-testid="version-title-input"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Release Notes</Label>
                <textarea
                  value={form.release_notes}
                  onChange={e => setForm(p => ({ ...p, release_notes: e.target.value }))}
                  placeholder="What's new in this version..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                  data-testid="release-notes-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_critical}
                  onCheckedChange={v => setForm(p => ({ ...p, is_critical: v }))}
                  data-testid="critical-toggle"
                />
                <Label className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Mark as critical update
                </Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !form.version.trim() || !form.title.trim()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl"
                  data-testid="save-version-btn"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  {editingId ? 'Update' : 'Publish'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-xl"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Versions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No versions published yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors"
              data-testid={`version-entry-${v.version}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400">v{v.version}</span>
                    {v.is_critical && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Critical
                      </span>
                    )}
                    {i === 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Latest
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{v.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatDate(v.created_at)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap leading-relaxed line-clamp-3">{v.release_notes}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                  <button
                    onClick={() => startEdit(v)}
                    className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    data-testid={`edit-version-${v.version}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    data-testid={`delete-version-${v.version}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminVersionManager;
