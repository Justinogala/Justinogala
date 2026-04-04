import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff, Lock, Fingerprint, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TwoFactorVerify from '@/components/admin/TwoFactorVerify';

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null); // { userId, method }
  
  const { login, isAuthenticated, loading, error, clearError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (fieldErrors[id]) {
      setFieldErrors(prev => ({ ...prev, [id]: null }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    if (!formData.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";
    if (!formData.password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(formData.email, formData.password);
    
    if (result.requires_2fa) {
      // Show 2FA verification screen
      setTwoFactorData({ userId: result.user_id, method: result.two_factor_method });
      return;
    }

    if (result.success) {
      toast({
        title: "Welcome back",
        description: "Admin session initialized successfully.",
        className: "bg-green-600 text-white border-none"
      });
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: result.error || "Invalid credentials. Please try again."
      });
    }
  };

  const handle2FASuccess = async () => {
    // After 2FA verification, complete the login
    const result = await login(formData.email, formData.password, true); // skip2fa flag
    if (result.success) {
      toast({
        title: "Welcome back",
        description: "Admin session initialized with 2FA verification.",
        className: "bg-green-600 text-white border-none"
      });
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <Helmet>
        <title>Admin Login | Munal</title>
        <meta name="description" content="Secure admin portal login" />
      </Helmet>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-10 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #e8a07a, #f0b89a, #e9a882)' }}>
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-white/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-orange-300/15 blur-[80px] pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 z-10 group" data-testid="admin-login-logo">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-2xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
            Munal
          </span>
        </Link>

        {/* Center Content */}
        <div className="z-10 space-y-8 -mt-10">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-slate-700" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 leading-tight">
              Administrative<br />Control Center
            </h2>
            <p className="text-base text-slate-700/70 max-w-xs leading-relaxed">
              Manage your organization, monitor team activity, and configure platform settings.
            </p>
          </div>

          {/* Security Badges */}
          <div className="flex items-center gap-3">
            {[
              { icon: Lock, label: 'Encrypted' },
              { icon: Fingerprint, label: 'MFA Ready' },
              { icon: ShieldCheck, label: 'SOC 2' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/25 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1.5">
                <Icon className="w-3 h-3 text-slate-700" />
                <span className="text-[11px] text-slate-700 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-[11px] text-slate-600/50 z-10">
          Munal AI by Munal AI Inc.
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-indigo-100/50 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-violet-100/40 to-transparent blur-3xl pointer-events-none" />

        {/* Mobile Logo */}
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 z-10 group lg:hidden" data-testid="admin-login-logo-mobile">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white font-bold text-base">M</span>
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600">
            Munal
          </span>
        </Link>

        <div className="w-full max-w-sm z-10">
          {/* 2FA Verification Screen */}
          {twoFactorData ? (
            <TwoFactorVerify
              userId={twoFactorData.userId}
              method={twoFactorData.method}
              onSuccess={handle2FASuccess}
              onCancel={() => setTwoFactorData(null)}
            />
          ) : (
          <>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-5">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight" data-testid="admin-login-title">Admin Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to continue</p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-5 animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="admin-login-form">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@munal.ai"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`h-11 bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 ${fieldErrors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                autoComplete="email"
                data-testid="admin-email-input"
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`h-11 bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 pr-10 ${fieldErrors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                  autoComplete="current-password"
                  data-testid="admin-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200"
              disabled={loading}
              data-testid="admin-login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Security Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100" data-testid="admin-login-security-footer">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <p className="text-[11px] text-slate-400 font-medium">
                Protected area. Authorized personnel only.
              </p>
            </div>
            <p className="text-[10px] text-center text-slate-300">
              IP Address Logged &amp; Monitored.
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
