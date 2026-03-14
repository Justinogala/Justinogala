
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import AuthSidebar from '@/components/auth/AuthSidebar';
import AuthFormContainer from '@/components/auth/AuthFormContainer';
import ChangePasswordModal from '@/components/ChangePasswordModal';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Change password modal state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempCredentials, setTempCredentials] = useState({ email: '', password: '' });

  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        // Check if user must change password
        if (result.user?.must_change_password) {
          setTempCredentials({ email: data.email, password: data.password });
          setShowChangePassword(true);
          setIsLoading(false);
          return;
        }
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in to Munal AI.",
        });
        navigate(from, { replace: true });
      } else {
        setAuthError(result.error || 'Invalid credentials');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChanged = (data) => {
    setShowChangePassword(false);
    // Update auth context with new user data and token
    localStorage.setItem('munal_auth', JSON.stringify(data.user));
    localStorage.setItem('munal_sessions', JSON.stringify({ 
      userId: data.user.id, 
      token: data.token,
      createdAt: new Date().toISOString()
    }));
    
    toast({
      title: "Password Updated",
      description: "Your password has been changed. Welcome to Munal AI!",
    });
    
    // Reload to update auth state
    window.location.href = from;
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Coming Soon",
      description: "Google login integration for Munal AI is currently in development.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">
      <Helmet>
        <title>Login - Munal AI</title>
        <meta name="description" content="Log in to your Munal AI account for meeting intelligence." />
      </Helmet>
      
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        email={tempCredentials.email}
        tempPassword={tempCredentials.password}
        onPasswordChanged={handlePasswordChanged}
      />
      
      {/* Left Sidebar - Purple Gradient */}
      <AuthSidebar 
        title="Sign in to Munal AI"
        subtitle="Access your intelligent meeting hub. Capture insights, track action items, and sync your team's knowledge."
        features={[
          { title: "Intelligent Transcription", description: "High-accuracy AI transcription for all your video and audio meetings." },
          { title: "Smart Insights", description: "AI-generated summaries that capture key decisions and context." },
          { title: "Automated Action Items", description: "Automatically extract and assign tasks from your conversations." }
        ]}
      />

      {/* Right Form Section */}
      <AuthFormContainer
        heading="Sign in"
        subheading="Welcome back to Munal AI! Please enter your details."
        footerLink={{
          text: "Don't have an account?",
          linkText: "Sign up",
          onClick: () => navigate('/signup')
        }}
      >
        {authError && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl transition-all"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 font-medium ml-1">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pr-10 h-12 bg-slate-50 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl transition-all"
                {...register("password", { required: "Password is required" })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" className="data-[state=checked]:bg-[#7C3AED] data-[state=checked]:border-[#7C3AED]" />
              <Label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">
                Remember me
              </Label>
            </div>
            <Link 
              to="/forgot-password" 
              className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="space-y-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline"
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium rounded-xl text-base transition-all hover:border-[#7C3AED]/30 hover:bg-purple-50"
              onClick={handleGoogleLogin}
            >
              <Chrome className="mr-2 h-5 w-5 text-slate-900" />
              Sign in with Google
            </Button>
          </div>
        </form>
      </AuthFormContainer>
    </div>
  );
};

export default LoginPage;
