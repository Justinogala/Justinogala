import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
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
    
    // Clear specific field error
    if (fieldErrors[id]) {
      setFieldErrors(prev => ({ ...prev, [id]: null }));
    }
    // Clear global error
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/40 to-lime-50/30">
      {/* Pastel gradient blooms (same as hero) */}
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-300/40 via-teal-200/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-b from-violet-200/20 via-slate-100/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-lime-200/25 via-emerald-100/15 to-transparent blur-3xl pointer-events-none" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1920 900">
        <defs><linearGradient id="admin-line" x1="0.6" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity="0.5"/><stop offset="100%" stopColor="#a3e635" stopOpacity="0.3"/></linearGradient></defs>
        <line x1="1200" y1="0" x2="1500" y2="900" stroke="url(#admin-line)" strokeWidth="2"/>
      </svg>
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      <Helmet>
        <title>Admin Login | Munal</title>
        <meta name="description" content="Secure admin portal login" />
      </Helmet>

      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 z-10 group" data-testid="admin-login-logo">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/40">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-purple-600 dark:from-violet-400 dark:to-purple-300 group-hover:from-violet-600 group-hover:to-purple-500 transition-all">
          Munal
        </span>
      </Link>
      
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-indigo-600 z-10 animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full w-fit mb-4 ring-8 ring-indigo-50 dark:ring-indigo-900/10">
            <ShieldCheck className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@munal.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 font-medium">{fieldErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={fieldErrors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-200" disabled={loading}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;