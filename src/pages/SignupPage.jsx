
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, AlertCircle, ArrowRight, Check, Mail, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import AuthSidebar from '@/components/auth/AuthSidebar';
import AuthFormContainer from '@/components/auth/AuthFormContainer';
import { cn } from '@/lib/utils';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accountType, setAccountType] = useState('personal');
  const [inviteData, setInviteData] = useState(null);

  // Validate invite token if present
  useEffect(() => {
    if (!inviteToken) return;
    const validate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/organizations/invite/validate?token=${inviteToken}`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setInviteData(data);
          setAccountType('invite');
        }
      } catch (err) { console.error('Invalid invite token', err); }
    };
    validate();
  }, [inviteToken]); // 'personal' or 'organization'

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const password = watch("password", "");

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      if (accountType === 'organization') {
        // Org self-registration flow
        if (!data.orgName?.trim()) {
          setAuthError('Organization name is required');
          setIsLoading(false);
          return;
        }
        const res = await fetch(`${API_URL}/api/organizations/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_name: data.orgName.trim(),
            domain: data.orgDomain?.trim() || null,
            description: data.orgDescription?.trim() || null,
            admin_name: `${data.firstName} ${data.lastName}`.trim(),
            admin_email: data.email,
            admin_password: data.password,
          })
        });
        const result = await res.json();
        if (!res.ok) {
          setAuthError(result.detail || 'Failed to create organization');
          setIsLoading(false);
          return;
        }
        // Log them in after org creation
        const loginResult = await signup(data.email, data.password, `${data.firstName} ${data.lastName}`.trim());
        if (loginResult?.success || loginResult?.requires_verification) {
          toast({ title: "Organization created!", description: `Welcome to Munal AI. ${data.orgName} is ready.` });
          navigate(loginResult.requires_verification ? '/verify-email' : '/dashboard');
        } else {
          // Org was created, but auto-login failed — just redirect to login
          toast({ title: "Organization created!", description: "Please log in with your new account." });
          navigate('/login');
        }
      } else {
        // Standard personal signup (or invite-based signup)
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        const result = await signup(data.email, data.password, fullName, inviteToken || null);
        
        if (result.requires_verification) {
          toast({ title: "Verification required", description: "Check your email for the verification code." });
          navigate('/verify-email', { state: { email: data.email, name: fullName, token: result.token } });
        } else if (result.success) {
          const desc = inviteData 
            ? `Welcome to ${inviteData.organization.name}!` 
            : "Welcome to Munal AI. Your intelligent workspace is ready.";
          toast({ title: "Account created!", description: desc });
          navigate('/dashboard');
        } else {
          setAuthError(result.error || 'Failed to create account');
        }
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 lg:min-h-screen lg:flex lg:flex-row lg:items-stretch">
      <Helmet>
        <title>Sign Up - Munal AI</title>
        <meta name="description" content="Create your Munal AI account to start automating your meeting notes." />
      </Helmet>
      
      {/* Left Sidebar - Purple Gradient */}
      <AuthSidebar 
        title="Create your Munal AI account"
        subtitle="Join forward-thinking teams using AI to reclaim hours of their week from manual meeting notes."
        features={[
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
          {/* Invite Banner */}
          {inviteData && (
            <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 rounded-xl" data-testid="invite-banner">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                {inviteData.organization.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                  Join {inviteData.organization.name}
                </p>
                <p className="text-[11px] text-violet-600 dark:text-violet-400">
                  Create your account to join the team as {inviteData.role}
                </p>
              </div>
            </div>
          )}

          {/* Account Type Toggle (hidden when invite) */}
          {!inviteData && (
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl" data-testid="account-type-toggle">
            <button
              type="button"
              onClick={() => setAccountType('personal')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                accountType === 'personal'
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
              data-testid="account-type-personal"
            >
              <User className="w-4 h-4" /> Personal
            </button>
            <button
              type="button"
              onClick={() => setAccountType('organization')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                accountType === 'organization'
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
              data-testid="account-type-organization"
            >
              <Building2 className="w-4 h-4" /> Organization
            </button>
          </div>
          )}

          {/* Organization Fields (only when org selected) */}
          {accountType === 'organization' && (
            <div className="space-y-3 p-4 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/30 rounded-xl" data-testid="org-fields">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Organization Details</p>
              <Input
                placeholder="Organization Name *"
                className="h-11 bg-white dark:bg-slate-900 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl"
                {...register("orgName", accountType === 'organization' ? { required: "Organization name is required" } : {})}
                data-testid="org-name-input"
              />
              {errors.orgName && <p className="text-xs text-red-500 font-medium ml-1">{errors.orgName.message}</p>}
              <Input
                placeholder="Domain (e.g. company.com)"
                className="h-11 bg-white dark:bg-slate-900 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl"
                {...register("orgDomain")}
                data-testid="org-domain-input"
              />
              <Input
                placeholder="Description (optional)"
                className="h-11 bg-white dark:bg-slate-900 border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 rounded-xl"
                {...register("orgDescription")}
                data-testid="org-desc-input"
              />
              <p className="text-[10px] text-slate-400">You&apos;ll be the organization admin. Add team members after setup.</p>
            </div>
          )}

          {accountType === 'organization' && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Admin Account</p>
          )}

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
            By clicking &ldquo;Get Started&rdquo;, you agree to our{' '}
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
                  {accountType === 'organization' ? 'Create Organization' : 'Get Started'} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </form>
      </AuthFormContainer>
    </div>
  );
};

export default SignupPage;
