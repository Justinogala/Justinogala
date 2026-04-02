import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Mail, Key, Copy, Check, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { API_URL } from '@/lib/api';

const UserTwoFactorSetup = ({ user }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState({ enabled: false, method: null, enforced: false });
  const [step, setStep] = useState('status'); // status | method | setup | verify | recovery | disable
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    if (user?.id) fetchStatus();
  }, [user?.id]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/2fa/status/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const startSetup = async (method) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSetupData(data);
      setSelectedMethod(method);
      setStep('setup');
    } catch (err) {
      toast({ title: 'Setup failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    setLoading(true);
    try {
      const method = selectedMethod === 'both' ? (setupData.qr_code ? 'totp' : 'email') : selectedMethod;
      const res = await fetch(`${API_URL}/api/user/2fa/verify-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, code: verifyCode, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setRecoveryCodes(data.recovery_codes || []);
      setStep('recovery');
      toast({ title: '2FA Enabled', description: 'Two-factor authentication is now active.' });
    } catch (err) {
      toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setStatus({ enabled: false, method: null, enforced: status.enforced });
      setStep('status');
      setDisableCode('');
      toast({ title: '2FA Disabled', description: 'Two-factor authentication has been removed.' });
    } catch (err) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishSetup = () => {
    setStep('status');
    setVerifyCode('');
    setSetupData(null);
    fetchStatus();
  };

  if (!user) return null;

  return (
    <Card data-testid="user-two-factor-setup">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
          </div>
          {status.enabled ? (
            <Badge className="bg-green-100 text-green-700">Enabled</Badge>
          ) : status.enforced ? (
            <Badge className="bg-red-100 text-red-700">Required</Badge>
          ) : (
            <Badge variant="outline">Disabled</Badge>
          )}
        </div>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Status View */}
        {step === 'status' && !status.enabled && (
          <div className="space-y-4">
            {status.enforced && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Your organization requires 2FA. Please enable it to continue using your account securely.
              </div>
            )}
            <p className="text-sm text-gray-500">Choose your preferred authentication method:</p>
            <div className="grid gap-3">
              <button
                data-testid="method-totp"
                onClick={() => startSetup('totp')}
                disabled={loading}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
              >
                <Smartphone className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-medium text-gray-900">Authenticator App</div>
                  <div className="text-xs text-gray-500">Use Google Authenticator, Authy, etc.</div>
                </div>
              </button>
              <button
                data-testid="method-email"
                onClick={() => startSetup('email')}
                disabled={loading}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
              >
                <Mail className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900">Email OTP</div>
                  <div className="text-xs text-gray-500">Receive a code via email each login</div>
                </div>
              </button>
              <button
                data-testid="method-both"
                onClick={() => startSetup('both')}
                disabled={loading}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
              >
                <Lock className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900">Both Methods</div>
                  <div className="text-xs text-gray-500">Maximum security with both options</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Enabled Status */}
        {step === 'status' && status.enabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                2FA is active using <strong>{status.method === 'both' ? 'Authenticator + Email' : status.method === 'totp' ? 'Authenticator App' : 'Email OTP'}</strong>
              </span>
            </div>
            {status.enforced ? (
              <p className="text-xs text-gray-400">2FA is enforced by your organization and cannot be disabled.</p>
            ) : (
              <Button
                data-testid="disable-2fa-btn"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setStep('disable')}
              >
                Disable 2FA
              </Button>
            )}
          </div>
        )}

        {/* Setup View - QR Code / Email */}
        {step === 'setup' && setupData && (
          <div className="space-y-4">
            {setupData.qr_code && (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">Scan this QR code with your authenticator app:</p>
                <img
                  data-testid="qr-code-img"
                  src={setupData.qr_code}
                  alt="QR Code"
                  className="mx-auto w-48 h-48 rounded-lg border"
                />
                {setupData.totp_secret && (
                  <p className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
                    Manual entry: {setupData.totp_secret}
                  </p>
                )}
              </div>
            )}
            {setupData.email_sent && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <Mail className="w-4 h-4" />
                A verification code was sent to your email.
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Enter verification code</label>
              <Input
                data-testid="verify-code-input"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={8}
              />
            </div>
            <div className="flex gap-2">
              <Button data-testid="verify-setup-btn" onClick={verifySetup} disabled={loading || !verifyCode} className="bg-purple-600 hover:bg-purple-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify & Enable
              </Button>
              <Button variant="outline" onClick={() => { setStep('status'); setSetupData(null); setVerifyCode(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Recovery Codes */}
        {step === 'recovery' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <Key className="w-4 h-4 flex-shrink-0" />
              Save these recovery codes. They can be used if you lose access to your authenticator.
            </div>
            <div data-testid="recovery-codes" className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {recoveryCodes.map((code, i) => (
                <div key={i} className="px-2 py-1 bg-white rounded border text-center">{code}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="copy-recovery-btn"
                variant="outline"
                onClick={copyRecoveryCodes}
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Codes'}
              </Button>
              <Button data-testid="done-btn" onClick={finishSetup} className="bg-purple-600 hover:bg-purple-700">
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Disable View */}
        {step === 'disable' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter your authenticator code or a recovery code to disable 2FA:</p>
            <Input
              data-testid="disable-code-input"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="Enter code"
              maxLength={8}
            />
            <div className="flex gap-2">
              <Button
                data-testid="confirm-disable-btn"
                variant="destructive"
                onClick={disable2FA}
                disabled={loading || !disableCode}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Disable 2FA
              </Button>
              <Button variant="outline" onClick={() => { setStep('status'); setDisableCode(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserTwoFactorSetup;
