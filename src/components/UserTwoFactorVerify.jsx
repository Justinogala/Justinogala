import React, { useState } from 'react';
import { Shield, Mail, Key, Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_URL } from '@/lib/api';

const UserTwoFactorVerify = ({ userId, method, userEmail, onVerified, onCancel }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(method === 'email' ? 'email' : 'totp');

  const verify = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/user/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      onVerified();
    } catch (err) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    try {
      await fetch(`${API_URL}/api/user/2fa/send-email-otp?user_id=${userId}`, { method: 'POST' });
      setError('');
    } catch {
      setError('Failed to resend code');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && code.length >= 6) verify();
  };

  const showTabs = method === 'both';

  const renderInput = (placeholder) => (
    <div className="space-y-3">
      <Input
        data-testid="two-factor-code-input"
        value={code}
        onChange={(e) => { setCode(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={8}
        className="text-center text-lg tracking-widest font-mono"
        autoFocus
      />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <Button
        data-testid="two-factor-submit"
        onClick={verify}
        disabled={loading || code.length < 6}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
        Verify
      </Button>
    </div>
  );

  return (
    <div data-testid="two-factor-verify" className="space-y-5">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your verification code to continue</p>
      </div>

      {showTabs ? (
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCode(''); setError(''); }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger data-testid="tab-totp" value="totp" className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> App
            </TabsTrigger>
            <TabsTrigger data-testid="tab-email" value="email" className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </TabsTrigger>
            <TabsTrigger data-testid="tab-recovery" value="recovery" className="flex items-center gap-1">
              <Key className="w-3 h-3" /> Recovery
            </TabsTrigger>
          </TabsList>
          <TabsContent value="totp" className="mt-4">
            <p className="text-sm text-gray-500 mb-3 text-center">Enter the code from your authenticator app</p>
            {renderInput('000000')}
          </TabsContent>
          <TabsContent value="email" className="mt-4">
            <p className="text-sm text-gray-500 mb-3 text-center">Enter the code sent to your email</p>
            {renderInput('Enter email code')}
            <Button variant="link" size="sm" className="w-full mt-2" onClick={resendEmail}>
              Resend code
            </Button>
          </TabsContent>
          <TabsContent value="recovery" className="mt-4">
            <p className="text-sm text-gray-500 mb-3 text-center">Enter one of your recovery codes</p>
            {renderInput('Recovery code')}
          </TabsContent>
        </Tabs>
      ) : method === 'totp' ? (
        <div>
          <p className="text-sm text-gray-500 mb-3 text-center">Enter the code from your authenticator app</p>
          {renderInput('000000')}
          <div className="mt-3">
            <p className="text-xs text-gray-400 text-center">Lost your device? Use a recovery code</p>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-3 text-center">Enter the code sent to {userEmail}</p>
          {renderInput('Enter email code')}
          <Button variant="link" size="sm" className="w-full mt-2" onClick={resendEmail}>
            Resend code
          </Button>
        </div>
      )}

      <Button
        data-testid="two-factor-cancel"
        variant="ghost"
        className="w-full"
        onClick={onCancel}
      >
        Back to login
      </Button>
    </div>
  );
};

export default UserTwoFactorVerify;
