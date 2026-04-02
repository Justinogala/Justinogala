import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Shield, ShieldCheck, ShieldAlert, Users, Send, Loader2,
  RefreshCw, CheckCircle2, AlertTriangle, Lock, Mail, Clock, Bell
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';

const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager', user: 'User' };
const ROLE_COLORS = {
  super_admin: 'bg-violet-100 text-violet-700 border-violet-200',
  admin: 'bg-blue-100 text-blue-700 border-blue-200',
  manager: 'bg-amber-100 text-amber-700 border-amber-200',
  user: 'bg-slate-100 text-slate-600 border-slate-200',
};

const Admin2FADashboardPage = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [togglingAuto, setTogglingAuto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa-dashboard/stats`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setStats(data);
      setSelected([]);
      setSelectAll(false);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load 2FA stats' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked && stats?.non_2fa_users) {
      setSelected(stats.non_2fa_users.map(u => u.id));
    } else {
      setSelected([]);
    }
  };

  const toggleUser = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const sendReminders = async (all = false) => {
    setSending(true);
    try {
      const body = all ? {} : { user_ids: selected };
      const res = await fetch(`${API_URL}/api/admin/2fa-dashboard/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      toast({
        title: 'Reminders Sent',
        description: `${data.sent} email(s) sent successfully${data.failed ? `, ${data.failed} failed` : ''}.`,
      });
      setSelected([]);
      setSelectAll(false);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to send reminders' });
    } finally {
      setSending(false);
    }
  };

  const toggleAutoReminder = async (checked) => {
    setTogglingAuto(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa-dashboard/auto-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
      });
      if (!res.ok) throw new Error('Failed');
      setStats(prev => ({
        ...prev,
        auto_reminder: { ...prev.auto_reminder, enabled: checked },
      }));
      toast({
        title: checked ? 'Auto-Reminder Enabled' : 'Auto-Reminder Disabled',
        description: checked
          ? 'Non-compliant users will receive weekly 2FA reminders automatically.'
          : 'Weekly auto-reminders have been turned off.',
      });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update auto-reminder' });
    } finally {
      setTogglingAuto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="2fa-dashboard-loading">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!stats) return null;

  const { total_users, total_enabled, total_disabled, adoption_rate, by_role, enforced, non_2fa_users, auto_reminder } = stats;

  return (
    <div className="space-y-6 p-1" data-testid="2fa-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-600" />
            2FA Adoption Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor two-factor authentication compliance across your organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {enforced && (
            <Badge className="bg-violet-100 text-violet-700 border-violet-200" variant="outline" data-testid="enforcement-badge">
              <Lock className="w-3 h-3 mr-1" /> Enforced
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="refresh-btn">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border" data-testid="stat-total-users">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{total_users}</p>
                <p className="text-xs text-text-secondary">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="stat-2fa-enabled">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{total_enabled}</p>
                <p className="text-xs text-text-secondary">2FA Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="stat-2fa-disabled">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{total_disabled}</p>
                <p className="text-xs text-text-secondary">2FA Disabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border" data-testid="stat-adoption-rate">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{adoption_rate}%</p>
                <p className="text-xs text-text-secondary">Adoption Rate</p>
              </div>
            </div>
            <Progress value={adoption_rate} className="h-2 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Auto-Reminder Card */}
      <Card className="border-border" data-testid="auto-reminder-card">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Weekly Auto-Reminder</h3>
                <p className="text-xs text-text-secondary">
                  Automatically email non-compliant users every Monday at 10 AM UTC.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {auto_reminder?.last_run && (
                <span className="text-xs text-text-secondary flex items-center gap-1" data-testid="auto-reminder-last-run">
                  <Clock className="w-3 h-3" />
                  Last run: {new Date(auto_reminder.last_run).toLocaleString()}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-reminder-toggle"
                  checked={auto_reminder?.enabled || false}
                  onCheckedChange={toggleAutoReminder}
                  disabled={togglingAuto}
                  data-testid="auto-reminder-toggle"
                />
                <Label htmlFor="auto-reminder-toggle" className="text-sm font-medium">
                  {auto_reminder?.enabled ? 'On' : 'Off'}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By-Role Breakdown */}
      <Card className="border-border" data-testid="role-breakdown">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-text-primary">Adoption by Role</CardTitle>
          <CardDescription>2FA compliance breakdown per user role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(by_role).map(([role, data]) => {
              const roleTotal = data.enabled + data.disabled;
              const pct = roleTotal > 0 ? Math.round((data.enabled / roleTotal) * 100) : 0;
              return (
                <div key={role} className="flex items-center gap-4" data-testid={`role-row-${role}`}>
                  <Badge className={`${ROLE_COLORS[role] || ROLE_COLORS.user} min-w-[100px] justify-center`} variant="outline">
                    {ROLE_LABELS[role] || role}
                  </Badge>
                  <div className="flex-1">
                    <Progress value={pct} className="h-2.5" />
                  </div>
                  <div className="flex items-center gap-2 min-w-[120px] justify-end">
                    <span className="text-xs text-emerald-600 font-medium">{data.enabled} on</span>
                    <span className="text-xs text-text-secondary">/</span>
                    <span className="text-xs text-red-500 font-medium">{data.disabled} off</span>
                    <span className="text-xs font-semibold text-text-primary ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(by_role).length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">No user data available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Non-compliant Users Table */}
      <Card className="border-border" data-testid="non-2fa-users-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Users Without 2FA ({non_2fa_users.length})
              </CardTitle>
              <CardDescription>Select users and send a reminder to enable 2FA.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={sending || selected.length === 0}
                onClick={() => sendReminders(false)}
                data-testid="send-selected-btn"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Mail className="w-4 h-4 mr-1" />}
                Send to Selected ({selected.length})
              </Button>
              <Button
                size="sm"
                disabled={sending || non_2fa_users.length === 0}
                onClick={() => sendReminders(true)}
                data-testid="send-all-btn"
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Remind All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {non_2fa_users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center" data-testid="all-compliant">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="font-semibold text-text-primary">All users have 2FA enabled!</p>
              <p className="text-sm text-text-secondary mt-1">Great job keeping the organization secure.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="non-2fa-users-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 w-8">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={toggleSelectAll}
                        data-testid="select-all-checkbox"
                      />
                    </th>
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Name</th>
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Email</th>
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Role</th>
                    <th className="text-left py-2 px-2 text-text-secondary font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {non_2fa_users.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors" data-testid={`user-row-${u.id}`}>
                      <td className="py-2.5 px-2">
                        <Checkbox
                          checked={selected.includes(u.id)}
                          onCheckedChange={() => toggleUser(u.id)}
                          data-testid={`user-checkbox-${u.id}`}
                        />
                      </td>
                      <td className="py-2.5 px-2 font-medium text-text-primary">{u.name || 'Unnamed'}</td>
                      <td className="py-2.5 px-2 text-text-secondary">{u.email}</td>
                      <td className="py-2.5 px-2">
                        <Badge className={`${ROLE_COLORS[u.role] || ROLE_COLORS.user} text-xs`} variant="outline">
                          {ROLE_LABELS[u.role] || u.role || 'user'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-text-secondary text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin2FADashboardPage;
