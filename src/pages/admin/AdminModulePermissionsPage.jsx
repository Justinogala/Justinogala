import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { getApiUrl } from '@/lib/api';
import { Shield, Check, X, Loader2, Save, RotateCcw, ChevronDown, ChevronRight, History, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MODULE_GROUPS = {
  Primary: ['dashboard'],
  Management: [
    'users', 'organizations', 'workspaces', 'reports', 'ir_sor_templates',
    'chat_moderation', 'shifts', 'support_tickets', 'messages',
    'broadcasts', 'approval_templates', 'forms'
  ],
  Billing: ['billing'],
  Configuration: [
    'monitoring', 'security_policies', 'meeting_analytics', 'cloud_storage',
    'video_settings', 'stripe_settings', 'video_history', 'api_settings',
    'transcription_settings', 'integrations', 'audit_logs', 'general_settings'
  ],
  'Super Admin': ['module_permissions'],
};

const AdminModulePermissionsPage = () => {
  const { isSuperAdmin } = useAdminAuth();
  const [templates, setTemplates] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [editState, setEditState] = useState({});
  const [dirty, setDirty] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({ Primary: true, Management: true, Billing: true, Configuration: true, 'Super Admin': true });
  const [toast, setToast] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const apiUrl = getApiUrl();
  const token = localStorage.getItem('admin_token');

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const h = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [modRes, tplRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/module-permissions/modules`, { headers: h }),
        fetch(`${apiUrl}/api/admin/module-permissions/templates`, { headers: h }),
      ]);
      const modData = await modRes.json();
      const tplData = await tplRes.json();
      setModules(modData.modules || []);
      const tpls = (tplData.templates || []).filter(t => t.role !== 'super_admin');
      setTemplates(tpls);

      const state = {};
      tpls.forEach(t => { state[t.role] = { ...t.permissions }; });
      setEditState(state);
      setDirty({});
    } catch (err) {
      showToast('Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token]);

  const fetchAuditLog = useCallback(async () => {
    setAuditLoading(true);
    try {
      const h = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${apiUrl}/api/admin/module-permissions/audit-log?limit=20`, { headers: h });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      // silent fail for audit log
    } finally {
      setAuditLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => { fetchData(); fetchAuditLog(); }, [fetchData, fetchAuditLog]);

  const togglePermission = (role, moduleKey) => {
    if (role === 'super_admin') return;
    setEditState(prev => ({
      ...prev,
      [role]: { ...prev[role], [moduleKey]: !prev[role]?.[moduleKey] }
    }));
    setDirty(prev => ({ ...prev, [role]: true }));
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const saveTemplate = async (role) => {
    setSaving(role);
    try {
      const res = await fetch(`${apiUrl}/api/admin/module-permissions/templates/${role}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permissions: editState[role] })
      });
      if (!res.ok) throw new Error('Save failed');
      setDirty(prev => ({ ...prev, [role]: false }));
      showToast(`${role.charAt(0).toUpperCase() + role.slice(1)} permissions saved`);
      fetchAuditLog();
    } catch (err) {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(null);
    }
  };

  const resetTemplate = (role) => {
    const original = templates.find(t => t.role === role);
    if (original) {
      setEditState(prev => ({ ...prev, [role]: { ...original.permissions } }));
      setDirty(prev => ({ ...prev, [role]: false }));
    }
  };

  const getModuleLabel = (key) => {
    const mod = modules.find(m => m.key === key);
    return mod?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const countEnabled = (role) => {
    const perms = editState[role] || {};
    return Object.values(perms).filter(Boolean).length;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="no-access-message">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only Super Admins can manage module permissions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-spinner">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const editableRoles = Object.keys(editState).filter(r => r !== 'super_admin');

  return (
    <div className="space-y-6" data-testid="module-permissions-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3" data-testid="page-title">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600 to-rose-600 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            Module Permissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Control which admin modules each role can access
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all",
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        )} data-testid="toast-message">
          {toast.msg}
        </div>
      )}

      {/* Permission Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid gap-0 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 sticky top-0 z-10"
          style={{ gridTemplateColumns: `minmax(220px, 1fr) ${editableRoles.map(() => 'minmax(120px, 1fr)').join(' ')}` }}
        >
          <div className="px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Module
          </div>
          {editableRoles.map(role => (
            <div key={role} className="px-4 py-4 text-center" data-testid={`role-header-${role}`}>
              <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">{role}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {countEnabled(role)} / {modules.length} enabled
              </p>
            </div>
          ))}
        </div>

        {/* Groups */}
        {Object.entries(MODULE_GROUPS).map(([groupName, groupModules]) => (
          <div key={groupName}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center gap-2 px-5 py-3 bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors"
              data-testid={`group-toggle-${groupName.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {expandedGroups[groupName] ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {groupName}
              </span>
              <span className="text-[10px] text-gray-400 ml-1">({groupModules.length})</span>
            </button>

            {/* Group Modules */}
            {expandedGroups[groupName] && groupModules.map((moduleKey) => (
              <div
                key={moduleKey}
                className="grid gap-0 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors"
                style={{ gridTemplateColumns: `minmax(220px, 1fr) ${editableRoles.map(() => 'minmax(120px, 1fr)').join(' ')}` }}
                data-testid={`module-row-${moduleKey}`}
              >
                <div className="px-5 py-3 flex items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {getModuleLabel(moduleKey)}
                  </span>
                </div>
                {editableRoles.map(role => {
                  const enabled = editState[role]?.[moduleKey] || false;
                  return (
                    <div key={role} className="px-4 py-3 flex items-center justify-center">
                      <button
                        onClick={() => togglePermission(role, moduleKey)}
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 border-2",
                          enabled
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600"
                            : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                        data-testid={`toggle-${role}-${moduleKey}`}
                      >
                        {enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Save Buttons */}
      <div className="flex flex-wrap gap-3 justify-end" data-testid="save-actions">
        {editableRoles.map(role => (
          <div key={role} className="flex items-center gap-2">
            {dirty[role] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetTemplate(role)}
                className="text-xs"
                data-testid={`reset-${role}-btn`}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset {role}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => saveTemplate(role)}
              disabled={!dirty[role] || saving === role}
              className={cn(
                "text-xs",
                dirty[role]
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
              data-testid={`save-${role}-btn`}
            >
              {saving === role ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save {role}
            </Button>
          </div>
        ))}
      </div>

      {/* Audit Log */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden" data-testid="audit-log-section">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <History className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">Activity Log</h2>
            <p className="text-xs text-gray-400">Track permission changes</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
          {auditLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400" data-testid="audit-log-empty">
              No permission changes recorded yet.
            </div>
          ) : (
            auditLogs.map((log, idx) => (
              <div key={idx} className="px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors" data-testid={`audit-log-entry-${idx}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                      log.action === 'template_update'
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                        : log.action === 'user_override'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}>
                      {log.action === 'template_update' ? 'Template' : log.action === 'user_override' ? 'User Override' : 'Reset'}
                    </span>
                    {log.role && (
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{log.role}</span>
                    )}
                    {log.user_email && (
                      <span className="text-xs text-gray-500">{log.user_email}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                {log.changes && log.changes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {log.changes.map((change, ci) => (
                      <span
                        key={ci}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium",
                          change.to
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        {change.to ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {change.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminModulePermissionsPage;
