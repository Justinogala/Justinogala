import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_API_URL || '';
const getApiUrl = () => API_URL || window.location.origin;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const email = location.state?.email || '';
  const name = location.state?.name || '';
  const token = location.state?.token || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Verification failed');
      }

      setVerified(true);
      toast({ title: 'Email verified!', description: 'Welcome to Munal AI.' });

      // Auto-login after verification
      if (data.user && data.token) {
        localStorage.setItem('munal_sessions', JSON.stringify({
          userId: data.user.id,
          token: data.token,
          createdAt: new Date().toISOString()
        }));
        localStorage.setItem('munal_auth', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
      }

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to resend');

      toast({ title: 'Code sent!', description: 'Check your email for the new code.' });
      setCooldown(60);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500" data-testid="verification-success">
          <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
          <p className="text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
      <div className="w-full max-w-md" data-testid="verify-email-page">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify your email</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-1.5 mt-1">
              <Mail className="w-4 h-4" />
              {email}
            </p>
          </div>

          {/* Code Input */}
          <div className="flex justify-center gap-2.5 mb-6" data-testid="verification-code-inputs">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                data-testid={`code-input-${i}`}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={loading || code.join('').length !== 6}
            data-testid="verify-email-btn"
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-base shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              'Verify Email'
            )}
          </Button>

          {/* Resend */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                data-testid="resend-code-btn"
                className="text-violet-600 dark:text-violet-400 font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </p>
          </div>

          {/* Back */}
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-6 mx-auto transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to signup
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Code expires in 15 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </div>
  );
}
