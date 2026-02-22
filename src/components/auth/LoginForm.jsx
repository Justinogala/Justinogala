
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import EmailInput from './EmailInput';
import PasswordInput from './PasswordInput';
import SignInButton from './SignInButton';
import SocialLoginButtons from './SocialLoginButtons';
import RememberMeCheckbox from './RememberMeCheckbox';
import ForgotPasswordLink from './ForgotPasswordLink';
import SignUpLink from './SignUpLink';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when typing
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    
    if (!formData.password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('loading');

    // Simulate network delay for better UX on the animation
    const result = await login(formData.email, formData.password);

    if (result.success) {
      setStatus('success');
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in to Munal.",
      });
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      setStatus('error');
      setErrors(prev => ({ ...prev, form: result.error || "Invalid credentials" }));
      toast({
        title: "Login Failed",
        description: result.error || "Invalid email or password",
        variant: "destructive"
      });
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <motion.div 
      className="w-full max-w-[400px] p-8 md:p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-none border border-gray-100 dark:border-gray-700"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In to Munal</h2>
        <p className="text-gray-500 dark:text-gray-400">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <EmailInput 
          value={formData.email} 
          onChange={handleChange} 
          error={errors.email}
          disabled={status === 'loading'} 
        />
        
        <PasswordInput 
          value={formData.password} 
          onChange={handleChange} 
          error={errors.password}
          disabled={status === 'loading'} 
        />

        <div className="flex items-center justify-between pt-2">
          <RememberMeCheckbox 
            checked={formData.rememberMe} 
            onChange={handleChange} 
          />
          <ForgotPasswordLink />
        </div>

        <div className="pt-2">
          <SignInButton status={status} disabled={status === 'loading'} />
        </div>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
        </div>
      </div>

      <SocialLoginButtons />
      <SignUpLink />
    </motion.div>
  );
};

export default LoginForm;
