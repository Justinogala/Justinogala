import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Smartphone, Mail, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { API_URL } from '@/lib/api';

const TwoFactorVerify = ({ userId, method, onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [tab, setTab] = useState(method === 'email' ? 'email' : 'totp'); // active input tab

  const verify = async () => {
    if (code.length < 6) return;
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setError(data.detail || 'Invalid code. Please try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    }
    setVerifying(false);
  };

  const resendEmail = async () => {
    setResending(true);
    try {
      await fetch(`${API_URL}/api/admin/2fa/send-email-otp?user_id=${userId}`, { method: 'POST' });
      setError('');
    } catch {}
    setResending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') verify();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[400px] mx-auto"
      data-testid="two-factor-verify"
    >
      <Card className="border-indigo-100 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-xl">Two-Factor Verification</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your verification code to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Method tabs for "both" */}
          {method === 'both' && (
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => { setTab('totp'); setCode(''); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm transition-all ${tab === 'totp' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium' : 'text-muted-foreground'}`}
                data-testid="tab-totp"
              >
                <Smartphone className="w-4 h-4" /> App
              </button>
              <button
                onClick={() => { setTab('email'); setCode(''); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm transition-all ${tab === 'email' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium' : 'text-muted-foreground'}`}
                data-testid="tab-email"
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button
                onClick={() => { setTab('recovery'); setCode(''); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm transition-all ${tab === 'recovery' ? 'bg-white dark:bg-slate-700 shadow-sm font-medium' : 'text-muted-foreground'}`}
                data-testid="tab-recovery"
              >
                <KeyRound className="w-4 h-4" /> Recovery
              </button>
            </div>
          )}

          {/* Hint text */}
          <p className="text-xs text-center text-muted-foreground">
            {tab === 'totp' && 'Enter the 6-digit code from your authenticator app'}
            {tab === 'email' && 'Enter the 6-digit code sent to your email'}
            {tab === 'recovery' && 'Enter one of your recovery codes (e.g. ABCD-EF12)'}
          </p>

          {/* Code input */}
          <Input
            value={code}
            onChange={(e) => {
              if (tab === 'recovery') {
                setCode(e.target.value.toUpperCase());
              } else {
                setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={tab === 'recovery' ? 'XXXX-XXXX' : '000000'}
            className={`text-center font-mono ${tab === 'recovery' ? 'text-lg tracking-widest' : 'text-2xl tracking-[0.5em]'}`}
            maxLength={tab === 'recovery' ? 9 : 6}
            autoFocus
            data-testid="two-factor-code-input"
          />

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 text-center" data-testid="two-factor-error">{error}</p>
          )}

          {/* Verify button */}
          <Button
            onClick={verify}
            disabled={code.length < 6 || verifying}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
            data-testid="two-factor-submit"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Verify
          </Button>

          {/* Resend email */}
          {(tab === 'email' || (method === 'email')) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resendEmail}
              disabled={resending}
              className="w-full text-xs"
              data-testid="resend-email-btn"
            >
              {resending ? 'Sending...' : "Didn't receive the code? Resend"}
            </Button>
          )}

          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={onCancel} className="w-full" data-testid="two-factor-cancel">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TwoFactorVerify;
