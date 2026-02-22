
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, AlertCircle, ArrowRight, Check, Chrome, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import AuthSidebar from '@/components/auth/AuthSidebar';
import AuthFormContainer from '@/components/auth/AuthFormContainer';
import { cn } from '@/lib/utils';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const password = watch("password", "");

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const result = await signup(data.email, data.password, fullName);
      
      if (result.success) {
        toast({
          title: "Account created!",
          description: "Welcome to Munal AI. Your intelligent workspace is ready.",
        });
        navigate('/dashboard');
      } else {
        setAuthError(result.error || 'Failed to create account');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    toast({
      title: "Coming Soon",
      description: "Google signup for Munal AI is currently in development.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">
      <Helmet>
        <title>Sign Up - Munal AI</title>
        <meta name="description" content="Create your Munal AI account to start automating your meeting notes." />
      </Helmet>
      
      {/* Left Sidebar - Purple Gradient */}
      <AuthSidebar 
        title="Create your Munal AI account"
        subtitle="Join forward-thinking teams using AI to reclaim hours of their week from manual meeting notes."
        features={[
          { title: "Universal Integration", description: "Works seamlessly with Zoom, Google Meet, and Microsoft Teams." },
          { title: "Team Knowledge Base", description: "Turn disparate meetings into a searchable, intelligent team library." },
          { title: "Advanced Privacy", description: "SOC2 compliant security ensures your meeting data stays private." }
        ]}
      />

      {/* Right Form Section */}
      <AuthFormContainer
        heading="Create an account"
        subheading="Start your Munal AI journey today. No credit card required."
        footerLink={{
          text: "Already have an account?",
          linkText: "Log in",
          onClick: () => navigate('/login')
        }}
      >
        {authError && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                className="h-12 bg-slate-50 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl transition-all"
                {...register("firstName", { required: "First name is required" })}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 font-medium ml-1">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                className="h-12 bg-slate-50 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl transition-all"
                {...register("lastName", { required: "Last name is required" })}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 font-medium ml-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className="pr-10 h-12 bg-slate-50 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl transition-all"
                {...register("password", { 
                  required: "Password is required",
                  minLength: { value: 8, message: "Must be at least 8 characters" }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Requirement Hint */}
            <div className="flex items-center gap-2 mt-2">
              <div className={cn("flex items-center justify-center w-4 h-4 rounded-full border text-[10px]", password.length >= 8 ? "bg-green-100 border-green-200 text-green-600" : "bg-slate-100 border-slate-200 text-slate-400")}>
                {password.length >= 8 && <Check className="w-2.5 h-2.5" />}
              </div>
              <span className={cn("text-xs transition-colors", password.length >= 8 ? "text-green-600 font-medium" : "text-slate-500")}>
                Must be at least 8 characters
              </span>
            </div>
            
            {errors.password && (
              <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>
            )}
          </div>

          <div className="text-xs text-slate-500 leading-relaxed">
            By clicking "Get Started", you agree to our{' '}
            <Link to="/legal/terms" className="text-[#7C3AED] hover:underline font-medium">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/legal/privacy" className="text-[#7C3AED] hover:underline font-medium">Privacy Policy</Link>.
          </div>

          <div className="space-y-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 group" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline"
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium rounded-xl text-base transition-all hover:border-[#7C3AED]/30 hover:bg-purple-50"
              onClick={handleGoogleSignup}
            >
              <Chrome className="mr-2 h-5 w-5 text-slate-900" />
              Sign up with Google
            </Button>
          </div>
        </form>
      </AuthFormContainer>
    </div>
  );
};

export default SignupPage;
