import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Clock, Key, Users, Video, Save, 
  AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

import { getApiUrl, API_URL } from '@/lib/api';

const AdminSecurityPolicies = () => {
  const { toast } = useToast();
  const [policies, setPolicies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/security/policies`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast({ variant: 'destructive', title: 'Failed to load security policies' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setPolicies(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const savePolicies = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/security/policies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policies)
      });

      if (response.ok) {
        toast({ title: 'Security policies updated successfully' });
        setHasChanges(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving policies:', error);
      toast({ variant: 'destructive', title: 'Failed to save security policies' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-testid="admin-security-policies">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security Policies</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Configure security settings and access controls
          </p>
        </div>
        <Button 
          onClick={savePolicies} 
          disabled={!hasChanges || saving}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-700 dark:text-yellow-300">You have unsaved changes</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-violet-600" />
              Password Requirements
            </CardTitle>
            <CardDescription>Configure password complexity rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password_min_length">Minimum Password Length</Label>
              <Input
                id="password_min_length"
                type="number"
                min={6}
                max={32}
                value={policies?.password_min_length || 8}
                onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Uppercase Letters</Label>
                <p className="text-sm text-slate-500">At least one A-Z</p>
              </div>
              <Switch
                checked={policies?.password_require_uppercase || false}
                onCheckedChange={(checked) => handleChange('password_require_uppercase', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Numbers</Label>
                <p className="text-sm text-slate-500">At least one 0-9</p>
              </div>
              <Switch
                checked={policies?.password_require_numbers || false}
                onCheckedChange={(checked) => handleChange('password_require_numbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Special Characters</Label>
                <p className="text-sm text-slate-500">At least one !@#$%</p>
              </div>
              <Switch
                checked={policies?.password_require_special || false}
                onCheckedChange={(checked) => handleChange('password_require_special', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Session Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Session Settings
            </CardTitle>
            <CardDescription>Configure session timeout and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                min={15}
                max={10080}
                value={policies?.session_timeout_minutes || 1440}
                onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500">
                Current: {Math.floor((policies?.session_timeout_minutes || 1440) / 60)} hours
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Lockout Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Account Lockout
            </CardTitle>
            <CardDescription>Configure failed login attempt handling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="max_failed_attempts">Max Failed Login Attempts</Label>
              <Input
                id="max_failed_attempts"
                type="number"
                min={3}
                max={10}
                value={policies?.max_failed_login_attempts || 5}
                onChange={(e) => handleChange('max_failed_login_attempts', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500">
                Account will be locked after this many failed attempts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
              <Input
                id="lockout_duration"
                type="number"
                min={5}
                max={1440}
                value={policies?.lockout_duration_minutes || 30}
                onChange={(e) => handleChange('lockout_duration_minutes', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500">
                How long the account stays locked
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-green-600" />
              Meeting Settings
            </CardTitle>
            <CardDescription>Configure meeting-related policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Instant Meetings</Label>
                <p className="text-sm text-slate-500">Allow users to start instant meetings</p>
              </div>
              <Switch
                checked={policies?.instant_meetings_enabled !== false}
                onCheckedChange={(checked) => handleChange('instant_meetings_enabled', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="max_meeting_duration">Max Meeting Duration (minutes)</Label>
              <Input
                id="max_meeting_duration"
                type="number"
                min={30}
                max={1440}
                value={policies?.max_meeting_duration_minutes || 480}
                onChange={(e) => handleChange('max_meeting_duration_minutes', parseInt(e.target.value))}
              />
              <p className="text-xs text-slate-500">
                Current: {Math.floor((policies?.max_meeting_duration_minutes || 480) / 60)} hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Current Policy Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-violet-600">
                {policies?.password_min_length || 8}
              </div>
              <div className="text-xs text-slate-500">Min Password Length</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor((policies?.session_timeout_minutes || 1440) / 60)}h
              </div>
              <div className="text-xs text-slate-500">Session Timeout</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {policies?.max_failed_login_attempts || 5}
              </div>
              <div className="text-xs text-slate-500">Max Failed Attempts</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor((policies?.max_meeting_duration_minutes || 480) / 60)}h
              </div>
              <div className="text-xs text-slate-500">Max Meeting Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurityPolicies;
