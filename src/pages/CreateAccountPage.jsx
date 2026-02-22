
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

// Auth Components
import AuthLeftSide from '@/components/auth/AuthLeftSide';
import AuthFormContainer from '@/components/auth/AuthFormContainer';
import AuthInput from '@/components/auth/AuthInput';
import AuthPasswordInput from '@/components/auth/AuthPasswordInput';
import AuthCheckbox from '@/components/auth/AuthCheckbox';
import AuthButton from '@/components/auth/AuthButton';
import AuthDivider from '@/components/auth/AuthDivider';
import AuthSocialButtons from '@/components/auth/AuthSocialButtons';
import Header from '@/components/Header'; // Import Header

const CreateAccountPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  const [formState, setFormState] = useState('idle'); // idle, loading, success, error
  const [errors, setErrors] = useState({});
  
  const { signup } = useAuth(); // Assuming signup function exists in AuthContext
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
    if (formState === 'error') {
       setFormState('idle');
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Full Name
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    else if (formData.fullName.length < 2) newErrors.fullName = "Name must be at least 2 characters";

    // Email
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";

    // Password
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!hasUpperCase || !hasLowerCase || !hasNumber) newErrors.password = "Must contain uppercase, lowercase and number";

    // Confirm Password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setFormState('error');
      setTimeout(() => setFormState('idle'), 500);
      return;
    }

    setFormState('loading');

    // Simulate API call or use real signup
    const result = await signup(formData.email, formData.password, formData.fullName);

    if (result.success) {
      setFormState('success');
      toast({
        title: "Account Created!",
        description: "Welcome to EchoNote AI. Please log in.",
        className: "bg-green-500 text-white border-none"
      });
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setFormState('error');
      setErrors(prev => ({ ...prev, email: result.error })); // Assuming error might be "email exists"
      toast({
        title: "Registration Failed",
        description: result.error || "Could not create account",
        variant: "destructive"
      });
      setTimeout(() => setFormState('idle'), 2000);
    }
  };

  const handleSocialClick = (platform) => {
    toast({
      title: "Feature Coming Soon",
      description: `${platform} signup is currently disabled for this demo.`,
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white dark:bg-gray-900">
      <Helmet>
        <title>Create Account - EchoNote AI</title>
      </Helmet>

      <Header /> {/* Render the Header component */}

      {/* Main content wrapper with dynamic top padding */}
      <div className="flex flex-col md:flex-row flex-1 pt-header-mobile md:pt-header-tablet lg:pt-header-desktop">
        {/* Left Side - Visuals */}
        <div className="w-full md:w-1/2 h-[40vh] md:h-full relative order-1">
          <AuthLeftSide 
            headline="Join EchoNote AI"
            subheadline="Create your account to get started"
            tagline="Transforming how teams capture, analyze, and share meeting insights."
          />
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 min-h-[60vh] md:min-h-full flex flex-col items-center justify-center p-4 md:p-8 order-2 bg-white dark:bg-gray-900">
          <AuthFormContainer
            title="Create Account"
            subtitle="Sign up to start using EchoNote"
            onSubmit={handleSubmit}
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
               <AuthInput
                id="fullName"
                label="Full Name"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                isValid={formData.fullName.length >= 2 && !errors.fullName}
                disabled={formState === 'loading' || formState === 'success'}
              />
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
               <AuthInput
                id="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                isValid={/\S+@\S+\.\S+/.test(formData.email) && !errors.email}
                disabled={formState === 'loading' || formState === 'success'}
              />
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
              <AuthPasswordInput
                id="password"
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                isValid={formData.password.length >= 8 && !errors.password} // Simplified visual check
                disabled={formState === 'loading' || formState === 'success'}
              />
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
              <AuthPasswordInput
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                isValid={formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password && !errors.confirmPassword}
                disabled={formState === 'loading' || formState === 'success'}
              />
            </motion.div>

            <motion.div 
              className="flex items-center"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
              initial="hidden" 
              animate="visible" 
              transition={{ delay: 0.5 }}
            >
              <AuthCheckbox
                id="termsAccepted"
                label={
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the <Link to="/legal/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                  </span>
                }
                checked={formData.termsAccepted}
                onChange={handleChange}
                error={errors.termsAccepted}
                disabled={formState === 'loading' || formState === 'success'}
              />
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
              <AuthButton 
                type="submit" 
                state={formState}
                disabled={formState === 'loading' || formState === 'success'}
              >
                Create Account
              </AuthButton>
            </motion.div>

            <AuthDivider text="Or sign up with" />

            <AuthSocialButtons 
              onGoogleClick={() => handleSocialClick('Google')}
              onGithubClick={() => handleSocialClick('GitHub')}
              onMicrosoftClick={() => handleSocialClick('Microsoft')}
            />

            <motion.p 
              className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                Sign in
              </Link>
            </motion.p>
          </AuthFormContainer>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPage;
