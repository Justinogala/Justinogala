import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield, ShieldCheck, ShieldOff, Smartphone, Mail, Copy,
  Loader2, CheckCircle2, AlertTriangle, KeyRound
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { API_URL } from '@/lib/api';

const TwoFactorSetup = () => {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState({ enabled: false, method: null });
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('idle'); // idle, choosing, setup, verify, recovery, disable
  const [method, setMethod] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    if (!adminUser?.id) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/2fa/status/${adminUser.id}`);
        if (res.ok) setStatus(await res.json());
      } catch (e) { console.error('Failed to load 2FA status:', e); }
      setLoading(false);
    };
    load();
  }, [adminUser?.id]);

  const startSetup = async (selectedMethod) => {
    setMethod(selectedMethod);
    setStep('setup');
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: adminUser.id, method: selectedMethod }),
      });
      if (res.ok) {
        setSetupData(await res.json());
      } else {
        toast({ variant: 'destructive', title: 'Setup failed' });
        setStep('idle');
      }
    } catch {
      toast({ variant: 'destructive', title: 'Setup failed' });
      setStep('idle');
    }
  };

  const verifySetup = async (verifyMethod) => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa/verify-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: adminUser.id, code, method: verifyMethod }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecoveryCodes(data.recovery_codes);
        setStep('recovery');
        setStatus({ enabled: true, method: data.method });
        toast({ title: '2FA enabled successfully!' });
      } else {
        toast({ variant: 'destructive', title: data.detail || 'Invalid code' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Verification failed' });
    }
    setVerifying(false);
  };

  const disable2FA = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: adminUser.id, code: disableCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ enabled: false, method: null });
        setStep('idle');
        setDisableCode('');
        toast({ title: '2FA disabled' });
      } else {
        toast({ variant: 'destructive', title: data.detail || 'Invalid code' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to disable 2FA' });
    }
    setVerifying(false);
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast({ title: 'Recovery codes copied to clipboard' });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card data-testid="two-factor-setup">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security to your admin account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900" data-testid="two-factor-status">
          {status.enabled ? (
            <>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">2FA Enabled</p>
                  <p className="text-xs text-muted-foreground">Method: {status.method === 'both' ? 'Authenticator App + Email' : status.method === 'totp' ? 'Authenticator App' : 'Email OTP'}</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <ShieldOff className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">2FA Not Enabled</p>
                  <p className="text-xs text-muted-foreground">Your account is less secure without 2FA</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">Off</Badge>
            </>
          )}
        </div>

        {/* Idle State — Enable/Disable buttons */}
        {step === 'idle' && !status.enabled && (
          <Button onClick={() => setStep('choosing')} className="w-full" data-testid="enable-2fa-btn">
            <Shield className="w-4 h-4 mr-2" /> Enable Two-Factor Authentication
          </Button>
        )}

        {step === 'idle' && status.enabled && (
          <Button variant="outline" onClick={() => setStep('disable')} className="text-red-600 border-red-200 hover:bg-red-50" data-testid="disable-2fa-btn">
            <ShieldOff className="w-4 h-4 mr-2" /> Disable 2FA
          </Button>
        )}

        {/* Method Selection */}
        {step === 'choosing' && (
          <div className="space-y-3" data-testid="method-selection">
            <p className="text-sm font-medium">Choose your preferred method:</p>
            <div className="grid gap-3">
              {[
                { key: 'totp', icon: Smartphone, title: 'Authenticator App', desc: 'Use Google Authenticator or Authy' },
                { key: 'email', icon: Mail, title: 'Email OTP', desc: 'Receive a code via email each login' },
                { key: 'both', icon: Shield, title: 'Both Methods', desc: 'Maximum security — use either method' },
              ].map(({ key, icon: Icon, title, desc }) => (
                <button
                  key={key}
                  onClick={() => startSetup(key)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left"
                  data-testid={`method-${key}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('idle')}>Cancel</Button>
          </div>
        )}

        {/* Setup — QR Code / Email sent */}
        {step === 'setup' && setupData && (
          <div className="space-y-4" data-testid="setup-step">
            {setupData.qr_code && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Scan this QR code with your authenticator app:</p>
                <div className="flex justify-center p-4 bg-white rounded-xl border">
                  <img src={setupData.qr_code} alt="2FA QR Code" className="w-48 h-48" data-testid="qr-code-img" />
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Can&apos;t scan? Enter code manually</summary>
                  <code className="block mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs break-all">{setupData.totp_secret}</code>
                </details>
              </div>
            )}

            {setupData.email_sent && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Mail className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-blue-700 dark:text-blue-400">A verification code has been sent to your email</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Enter verification code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                data-testid="verify-code-input"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => verifySetup(method === 'both' ? 'totp' : method)}
                disabled={code.length !== 6 || verifying}
                className="flex-1"
                data-testid="verify-setup-btn"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Verify & Enable
              </Button>
              <Button variant="ghost" onClick={() => { setStep('idle'); setCode(''); setSetupData(null); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Recovery Codes */}
        {step === 'recovery' && (
          <div className="space-y-4" data-testid="recovery-codes">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">Save your recovery codes</p>
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">These codes can be used if you lose access to your authenticator. Each code can only be used once. Store them somewhere safe.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
              {recoveryCodes.map((c, i) => (
                <div key={i} className="font-mono text-sm text-center p-1.5 bg-white dark:bg-slate-800 rounded border">
                  <KeyRound className="w-3 h-3 inline mr-1.5 text-muted-foreground" />{c}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={copyRecoveryCodes} className="w-full" data-testid="copy-recovery-btn">
              <Copy className="w-4 h-4 mr-2" /> Copy All Codes
            </Button>

            <Button onClick={() => { setStep('idle'); setRecoveryCodes([]); setCode(''); }} className="w-full" data-testid="done-btn">
              Done
            </Button>
          </div>
        )}

        {/* Disable 2FA */}
        {step === 'disable' && (
          <div className="space-y-3" data-testid="disable-step">
            <p className="text-sm text-muted-foreground">Enter your authenticator code or a recovery code to disable 2FA:</p>
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="Enter code"
              className="text-center font-mono"
              data-testid="disable-code-input"
            />
            <div className="flex gap-2">
              <Button variant="destructive" onClick={disable2FA} disabled={!disableCode || verifying} className="flex-1" data-testid="confirm-disable-btn">
                {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldOff className="w-4 h-4 mr-2" />}
                Disable 2FA
              </Button>
              <Button variant="ghost" onClick={() => { setStep('idle'); setDisableCode(''); }}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
